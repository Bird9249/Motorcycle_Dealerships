import { eq } from "drizzle-orm";
import { paymentSchedules } from "@/server/platform/db/schema/sales";
import type { DbTransaction } from "@/shared/types";

export async function getPaymentScheduleById(
  id: string,
  client: DbTransaction,
) {
  const rows = await client
    .select({
      id: paymentSchedules.id,
      salesOrderId: paymentSchedules.salesOrderId,
      installmentNumber: paymentSchedules.installmentNumber,
      dueDate: paymentSchedules.dueDate,
      amount: paymentSchedules.amount,
      currency: paymentSchedules.currency,
      status: paymentSchedules.status,
      paidAt: paymentSchedules.paidAt,
      paidAmount: paymentSchedules.paidAmount,
    })
    .from(paymentSchedules)
    .where(eq(paymentSchedules.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function updatePaymentScheduleById(
  id: string,
  values: Partial<typeof paymentSchedules.$inferInsert>,
  client: DbTransaction,
) {
  const [updated] = await client
    .update(paymentSchedules)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(paymentSchedules.id, id))
    .returning({
      id: paymentSchedules.id,
      status: paymentSchedules.status,
      paidAt: paymentSchedules.paidAt,
      paidAmount: paymentSchedules.paidAmount,
    });
  return updated ?? null;
}
