import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import type { CreatePaymentDTO } from "../contracts";
import {
  generatePaymentNumber,
  insertPayment,
} from "../repo/payments";
import {
  assertAmountWithinScheduleDue,
  assertPaymentAccountForRecord,
  assertRecordableOrder,
  resolvePaymentLink,
} from "./validate-payment";

function formatMoney(value: string | number): string {
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return n.toFixed(2);
}

export async function recordPaymentService(
  client: DbTransaction,
  params: { input: CreatePaymentDTO; recordedBy: string },
) {
  const { salesOrderId, paymentScheduleId, schedule } =
    await resolvePaymentLink(client, {
      salesOrderId: params.input.salesOrderId,
      paymentScheduleId: params.input.paymentScheduleId,
    });

  const order = await assertRecordableOrder(client, salesOrderId);

  await assertPaymentAccountForRecord(
    client,
    params.input.paymentAccountId,
    params.input.currency,
    params.input.paymentMethod,
  );

  if (schedule) {
    if (schedule.currency !== params.input.currency) {
      throw new AppError(
        "CURRENCY_MISMATCH",
        "Payment currency must match schedule currency",
      );
    }
    await assertAmountWithinScheduleDue(client, {
      paymentScheduleId: schedule.id,
      amount: params.input.amount,
      scheduleAmount: schedule.amount,
    });
  } else if (params.input.currency !== order.saleCurrency) {
    throw new AppError(
      "CURRENCY_MISMATCH",
      "Payment currency should match order sale currency",
    );
  }

  const now = nowDate();
  const paymentNumber = await generatePaymentNumber(client);

  const created = await insertPayment(
    {
      paymentNumber,
      salesOrderId,
      paymentScheduleId,
      paymentAccountId: params.input.paymentAccountId,
      amount: formatMoney(params.input.amount),
      currency: params.input.currency,
      paymentMethod: params.input.paymentMethod,
      paidAt: params.input.paidAt,
      slipImageKey: params.input.slipImageKey?.trim() || null,
      slipVerified: false,
      status: "pending",
      notes: params.input.notes?.trim() || null,
      recordedBy: params.recordedBy,
      createdAt: now,
      updatedAt: now,
    },
    client,
  );

  if (!created) {
    throw new AppError("CREATE_FAILED", "Failed to record payment");
  }

  return { created };
}
