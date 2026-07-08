import { and, eq } from "drizzle-orm";
import { user } from "@/server/platform/db/schema/auth";
import {
  dailyReconciliations,
  paymentAccounts,
} from "@/server/platform/db/schema/payments";
import { toDateOnlyString } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";

function toDateColumnValue(date: Date | string): Date {
  const str =
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? date
      : toDateOnlyString(date);
  return new Date(`${str}T00:00:00`);
}

export async function listReconciliationsByDate(
  reconciliationDate: Date,
  client: DbTransaction,
) {
  const dateValue = toDateColumnValue(reconciliationDate);
  const rows = await client
    .select({
      id: dailyReconciliations.id,
      reconciliationDate: dailyReconciliations.reconciliationDate,
      paymentAccountId: dailyReconciliations.paymentAccountId,
      expectedAmount: dailyReconciliations.expectedAmount,
      actualAmount: dailyReconciliations.actualAmount,
      difference: dailyReconciliations.difference,
      status: dailyReconciliations.status,
      notes: dailyReconciliations.notes,
      reconciledBy: dailyReconciliations.reconciledBy,
      reconciledAt: dailyReconciliations.reconciledAt,
      paymentAccountName: paymentAccounts.name,
      paymentAccountType: paymentAccounts.type,
      paymentAccountCurrency: paymentAccounts.currency,
      reconciledByName: user.name,
    })
    .from(dailyReconciliations)
    .innerJoin(
      paymentAccounts,
      eq(paymentAccounts.id, dailyReconciliations.paymentAccountId),
    )
    .leftJoin(user, eq(user.id, dailyReconciliations.reconciledBy))
    .where(eq(dailyReconciliations.reconciliationDate, dateValue));

  return rows.map((row) => ({
    id: row.id,
    reconciliationDate: row.reconciliationDate,
    paymentAccountId: row.paymentAccountId,
    expectedAmount: row.expectedAmount,
    actualAmount: row.actualAmount,
    difference: row.difference,
    status: row.status,
    notes: row.notes,
    reconciledBy: row.reconciledBy,
    reconciledAt: row.reconciledAt,
    paymentAccount: {
      id: row.paymentAccountId,
      name: row.paymentAccountName,
      type: row.paymentAccountType,
      currency: row.paymentAccountCurrency,
    },
    reconciledByUser: row.reconciledByName
      ? { name: row.reconciledByName }
      : null,
  }));
}

export async function upsertReconciliationRow(
  values: typeof dailyReconciliations.$inferInsert,
  client: DbTransaction,
) {
  const dateValue = toDateColumnValue(values.reconciliationDate);

  const [row] = await client
    .insert(dailyReconciliations)
    .values({ ...values, reconciliationDate: dateValue })
    .onConflictDoUpdate({
      target: [
        dailyReconciliations.reconciliationDate,
        dailyReconciliations.paymentAccountId,
      ],
      set: {
        expectedAmount: values.expectedAmount,
        actualAmount: values.actualAmount,
        difference: values.difference,
        status: values.status,
        notes: values.notes,
        reconciledBy: values.reconciledBy,
        reconciledAt: values.reconciledAt,
        updatedAt: values.updatedAt ?? new Date(),
      },
    })
    .returning({ id: dailyReconciliations.id });

  if (!row) return null;

  const rows = await listReconciliationsByDate(dateValue, client);
  return rows.find((r) => r.paymentAccountId === values.paymentAccountId) ?? null;
}

export async function getReconciliationByAccountAndDate(
  paymentAccountId: string,
  reconciliationDate: Date,
  client: DbTransaction,
) {
  const dateValue = toDateColumnValue(reconciliationDate);
  const rows = await client
    .select({ id: dailyReconciliations.id })
    .from(dailyReconciliations)
    .where(
      and(
        eq(dailyReconciliations.paymentAccountId, paymentAccountId),
        eq(dailyReconciliations.reconciliationDate, dateValue),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}
