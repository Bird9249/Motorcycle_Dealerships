import { and, eq, ilike, or } from "drizzle-orm";
import { financeCompanies } from "@/server/platform/db/schema/sales";
import type { DbTransaction } from "@/shared/types";
import type { FinanceCompaniesListQueryDTO } from "../contracts";

export async function listFinanceCompanies(
  query: FinanceCompaniesListQueryDTO,
  client: DbTransaction,
) {
  const conditions = [];

  if (query.active === "true") {
    conditions.push(eq(financeCompanies.isActive, true));
  } else if (query.active === "false") {
    conditions.push(eq(financeCompanies.isActive, false));
  }

  if (query.q) {
    const pattern = `%${query.q}%`;
    conditions.push(
      or(
        ilike(financeCompanies.name, pattern),
        ilike(financeCompanies.code, pattern),
      ),
    );
  }

  const whereExpr = conditions.length > 0 ? and(...conditions) : undefined;

  return client
    .select({
      id: financeCompanies.id,
      name: financeCompanies.name,
      code: financeCompanies.code,
      contactPhone: financeCompanies.contactPhone,
      isActive: financeCompanies.isActive,
      createdAt: financeCompanies.createdAt,
    })
    .from(financeCompanies)
    .where(whereExpr)
    .orderBy(financeCompanies.name);
}

export async function getFinanceCompanyRecordById(
  id: string,
  client: DbTransaction,
) {
  const rows = await client
    .select({
      id: financeCompanies.id,
      name: financeCompanies.name,
      code: financeCompanies.code,
      contactPhone: financeCompanies.contactPhone,
      isActive: financeCompanies.isActive,
      createdAt: financeCompanies.createdAt,
    })
    .from(financeCompanies)
    .where(eq(financeCompanies.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function findFinanceCompanyByCode(
  code: string,
  client: DbTransaction,
  excludeId?: string,
) {
  const rows = await client
    .select({ id: financeCompanies.id })
    .from(financeCompanies)
    .where(eq(financeCompanies.code, code))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (excludeId && row.id === excludeId) return null;
  return row;
}

export async function insertFinanceCompany(
  values: typeof financeCompanies.$inferInsert,
  client: DbTransaction,
) {
  const [created] = await client
    .insert(financeCompanies)
    .values(values)
    .returning({
      id: financeCompanies.id,
      name: financeCompanies.name,
      code: financeCompanies.code,
      contactPhone: financeCompanies.contactPhone,
      isActive: financeCompanies.isActive,
      createdAt: financeCompanies.createdAt,
    });
  return created ?? null;
}

export async function updateFinanceCompanyById(
  id: string,
  values: Partial<typeof financeCompanies.$inferInsert>,
  client: DbTransaction,
) {
  const [updated] = await client
    .update(financeCompanies)
    .set(values)
    .where(eq(financeCompanies.id, id))
    .returning({
      id: financeCompanies.id,
      name: financeCompanies.name,
      code: financeCompanies.code,
      contactPhone: financeCompanies.contactPhone,
      isActive: financeCompanies.isActive,
      createdAt: financeCompanies.createdAt,
    });
  return updated ?? null;
}
