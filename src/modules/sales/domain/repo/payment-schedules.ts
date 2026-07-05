import { eq } from "drizzle-orm";
import { paymentSchedules } from "@/server/platform/db/schema/sales";
import type { DbTransaction } from "@/shared/types";
import type { SchedulePreviewItem } from "../service/calculate-installment";
import { formatMoney } from "../service/calculate-installment";

export async function listPaymentSchedulesByOrderId(
  salesOrderId: string,
  client: DbTransaction,
) {
  return client
    .select({
      id: paymentSchedules.id,
      installmentNumber: paymentSchedules.installmentNumber,
      dueDate: paymentSchedules.dueDate,
      amount: paymentSchedules.amount,
      currency: paymentSchedules.currency,
      status: paymentSchedules.status,
      paidAt: paymentSchedules.paidAt,
      paidAmount: paymentSchedules.paidAmount,
    })
    .from(paymentSchedules)
    .where(eq(paymentSchedules.salesOrderId, salesOrderId))
    .orderBy(paymentSchedules.installmentNumber);
}

export async function insertPaymentSchedules(
  salesOrderId: string,
  items: SchedulePreviewItem[],
  client: DbTransaction,
) {
  if (items.length === 0) return [];

  const now = new Date();
  const rows = items.map((item) => ({
    salesOrderId,
    installmentNumber: item.installmentNumber,
    dueDate: item.dueDate,
    amount: formatMoney(item.amount),
    currency: item.currency,
    status: "pending" as const,
    createdAt: now,
    updatedAt: now,
  }));

  return client.insert(paymentSchedules).values(rows).returning({
    id: paymentSchedules.id,
    installmentNumber: paymentSchedules.installmentNumber,
  });
}
