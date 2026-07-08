import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { paymentAccounts } from "@/server/platform/db/schema/payments";
import type { DbTransaction } from "@/shared/types";
import type { PaymentAccountsListQueryDTO } from "../contracts";

export async function listPaymentAccounts(
  query: PaymentAccountsListQueryDTO,
  client: DbTransaction,
) {
  const conditions = [];

  if (query.active === "true") {
    conditions.push(eq(paymentAccounts.isActive, true));
  } else if (query.active === "false") {
    conditions.push(eq(paymentAccounts.isActive, false));
  }

  if (query.type) {
    conditions.push(eq(paymentAccounts.type, query.type));
  }

  if (query.q) {
    const pattern = `%${query.q}%`;
    conditions.push(
      or(
        ilike(paymentAccounts.name, pattern),
        ilike(paymentAccounts.bankName, pattern),
        ilike(paymentAccounts.accountNumber, pattern),
      ),
    );
  }

  const whereExpr = conditions.length > 0 ? and(...conditions) : undefined;

  return client
    .select({
      id: paymentAccounts.id,
      name: paymentAccounts.name,
      type: paymentAccounts.type,
      bankName: paymentAccounts.bankName,
      accountNumber: paymentAccounts.accountNumber,
      currency: paymentAccounts.currency,
      qrCodeImageKey: paymentAccounts.qrCodeImageKey,
      isActive: paymentAccounts.isActive,
      displayOrder: paymentAccounts.displayOrder,
      createdAt: paymentAccounts.createdAt,
      updatedAt: paymentAccounts.updatedAt,
    })
    .from(paymentAccounts)
    .where(whereExpr)
    .orderBy(asc(paymentAccounts.displayOrder), asc(paymentAccounts.name));
}

export async function getPaymentAccountById(id: string, client: DbTransaction) {
  const rows = await client
    .select({
      id: paymentAccounts.id,
      name: paymentAccounts.name,
      type: paymentAccounts.type,
      bankName: paymentAccounts.bankName,
      accountNumber: paymentAccounts.accountNumber,
      currency: paymentAccounts.currency,
      qrCodeImageKey: paymentAccounts.qrCodeImageKey,
      isActive: paymentAccounts.isActive,
      displayOrder: paymentAccounts.displayOrder,
      createdAt: paymentAccounts.createdAt,
      updatedAt: paymentAccounts.updatedAt,
    })
    .from(paymentAccounts)
    .where(eq(paymentAccounts.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function insertPaymentAccount(
  values: typeof paymentAccounts.$inferInsert,
  client: DbTransaction,
) {
  const [created] = await client
    .insert(paymentAccounts)
    .values(values)
    .returning({
      id: paymentAccounts.id,
      name: paymentAccounts.name,
      type: paymentAccounts.type,
      bankName: paymentAccounts.bankName,
      accountNumber: paymentAccounts.accountNumber,
      currency: paymentAccounts.currency,
      qrCodeImageKey: paymentAccounts.qrCodeImageKey,
      isActive: paymentAccounts.isActive,
      displayOrder: paymentAccounts.displayOrder,
      createdAt: paymentAccounts.createdAt,
      updatedAt: paymentAccounts.updatedAt,
    });
  return created ?? null;
}

export async function updatePaymentAccountById(
  id: string,
  values: Partial<typeof paymentAccounts.$inferInsert>,
  client: DbTransaction,
) {
  const [updated] = await client
    .update(paymentAccounts)
    .set(values)
    .where(eq(paymentAccounts.id, id))
    .returning({
      id: paymentAccounts.id,
      name: paymentAccounts.name,
      type: paymentAccounts.type,
      bankName: paymentAccounts.bankName,
      accountNumber: paymentAccounts.accountNumber,
      currency: paymentAccounts.currency,
      qrCodeImageKey: paymentAccounts.qrCodeImageKey,
      isActive: paymentAccounts.isActive,
      displayOrder: paymentAccounts.displayOrder,
      createdAt: paymentAccounts.createdAt,
      updatedAt: paymentAccounts.updatedAt,
    });
  return updated ?? null;
}

export async function getMaxDisplayOrder(client: DbTransaction) {
  const rows = await client
    .select({ displayOrder: paymentAccounts.displayOrder })
    .from(paymentAccounts)
    .orderBy(desc(paymentAccounts.displayOrder))
    .limit(1);
  return rows[0]?.displayOrder ?? -1;
}
