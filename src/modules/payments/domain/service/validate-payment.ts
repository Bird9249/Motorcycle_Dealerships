import { AppError } from "@/shared/errors";
import type { DbTransaction } from "@/shared/types";
import { getSalesOrderSnapshot } from "@/modules/sales/domain/repo/sales-orders";
import { getPaymentAccountById } from "../repo/payment-accounts";
import { getPaymentScheduleById, updatePaymentScheduleById } from "../repo/payment-schedules";
import { sumVerifiedAmountForSchedule } from "../repo/payments";

function parseMoney(value: string | number): number {
  return typeof value === "number" ? value : Number.parseFloat(value);
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}

export async function resolvePaymentLink(
  client: DbTransaction,
  input: {
    salesOrderId?: string | null;
    paymentScheduleId?: string | null;
  },
) {
  let salesOrderId = input.salesOrderId ?? null;
  let paymentScheduleId = input.paymentScheduleId ?? null;

  if (paymentScheduleId) {
    const schedule = await getPaymentScheduleById(paymentScheduleId, client);
    if (!schedule) {
      throw new AppError("NOT_FOUND", "Payment schedule not found");
    }
    if (schedule.status === "paid" || schedule.status === "waived") {
      throw new AppError(
        "INVALID_STATUS",
        "Payment schedule is already paid or waived",
      );
    }
    if (salesOrderId && salesOrderId !== schedule.salesOrderId) {
      throw new AppError(
        "VALIDATION_LINK",
        "Payment schedule does not belong to the sales order",
      );
    }
    salesOrderId = schedule.salesOrderId;
    return { salesOrderId, paymentScheduleId, schedule };
  }

  if (!salesOrderId) {
    throw new AppError(
      "VALIDATION_LINK",
      "salesOrderId or paymentScheduleId is required",
    );
  }

  return { salesOrderId, paymentScheduleId, schedule: null };
}

export async function assertRecordableOrder(
  client: DbTransaction,
  salesOrderId: string,
) {
  const order = await getSalesOrderSnapshot(salesOrderId, client);
  if (!order) {
    throw new AppError("NOT_FOUND", "Sales order not found");
  }
  if (order.status === "draft" || order.status === "cancelled") {
    throw new AppError(
      "INVALID_STATUS",
      "Cannot record payment for draft or cancelled orders",
    );
  }
  return order;
}

export async function assertPaymentAccountForRecord(
  client: DbTransaction,
  paymentAccountId: string,
  currency: "LAK" | "THB" | "USD",
  paymentMethod: "cash" | "bank_transfer",
) {
  const account = await getPaymentAccountById(paymentAccountId, client);
  if (!account) {
    throw new AppError("NOT_FOUND", "Payment account not found");
  }
  if (!account.isActive) {
    throw new AppError("INVALID_STATUS", "Payment account is inactive");
  }
  if (account.currency !== currency) {
    throw new AppError(
      "CURRENCY_MISMATCH",
      "Payment currency must match payment account currency",
    );
  }
  if (account.type === "cash" && paymentMethod !== "cash") {
    throw new AppError(
      "VALIDATION_LINK",
      "Cash account requires cash payment method",
    );
  }
  if (account.type === "bank_transfer" && paymentMethod !== "bank_transfer") {
    throw new AppError(
      "VALIDATION_LINK",
      "Bank account requires bank transfer payment method",
    );
  }
  return account;
}

export async function assertAmountWithinScheduleDue(
  client: DbTransaction,
  params: {
    paymentScheduleId: string;
    amount: string | number;
    scheduleAmount: string;
    excludePaymentId?: string;
  },
) {
  const verifiedSum = parseMoney(
    await sumVerifiedAmountForSchedule(
      params.paymentScheduleId,
      client,
      params.excludePaymentId,
    ),
  );
  const due = parseMoney(params.scheduleAmount) - verifiedSum;
  const amount = parseMoney(params.amount);

  if (amount <= 0) {
    throw new AppError("VALIDATION_LINK", "Amount must be greater than zero");
  }
  if (amount > due + 0.001) {
    throw new AppError(
      "AMOUNT_EXCEEDS_DUE",
      `Amount exceeds remaining due (${formatMoney(Math.max(due, 0))})`,
    );
  }
}

export async function syncScheduleAfterVerify(
  client: DbTransaction,
  params: {
    paymentScheduleId: string;
    verifiedAt: Date;
  },
) {
  const schedule = await getPaymentScheduleById(
    params.paymentScheduleId,
    client,
  );
  if (!schedule) return;

  const verifiedSum = parseMoney(
    await sumVerifiedAmountForSchedule(params.paymentScheduleId, client),
  );
  const scheduleAmount = parseMoney(schedule.amount);
  const paidAmount = formatMoney(verifiedSum);

  if (verifiedSum >= scheduleAmount - 0.001) {
    await updatePaymentScheduleById(
      params.paymentScheduleId,
      {
        status: "paid",
        paidAt: params.verifiedAt,
        paidAmount,
      },
      client,
    );
  } else {
    const status =
      schedule.status === "overdue" ? "overdue" : ("pending" as const);
    await updatePaymentScheduleById(
      params.paymentScheduleId,
      { status, paidAmount },
      client,
    );
  }
}
