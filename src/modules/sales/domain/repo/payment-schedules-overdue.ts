import { and, eq, lt } from "drizzle-orm";
import { paymentSchedules } from "@/server/platform/db/schema/sales";
import type { DbTransaction } from "@/shared/types";

export async function markOverduePaymentSchedules(client: DbTransaction) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const updated = await client
    .update(paymentSchedules)
    .set({ status: "overdue", updatedAt: new Date() })
    .where(
      and(
        eq(paymentSchedules.status, "pending"),
        lt(paymentSchedules.dueDate, today),
      ),
    )
    .returning({ id: paymentSchedules.id });

  return { count: updated.length, ids: updated.map((r) => r.id) };
}
