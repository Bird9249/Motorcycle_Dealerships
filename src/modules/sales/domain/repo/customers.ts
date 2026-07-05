import { and, eq, ilike, or, sql } from "drizzle-orm";
import { customers } from "@/server/platform/db/schema/customers";
import type { DbTransaction } from "@/shared/types";
import type { CustomersListQueryDTO } from "../contracts";

const customerSelect = {
  id: customers.id,
  fullName: customers.fullName,
  phone: customers.phone,
  phoneSecondary: customers.phoneSecondary,
  village: customers.village,
  district: customers.district,
  province: customers.province,
  idCardNumber: customers.idCardNumber,
  householdBookNumber: customers.householdBookNumber,
  notes: customers.notes,
  createdAt: customers.createdAt,
  updatedAt: customers.updatedAt,
};

export async function listCustomers(
  query: CustomersListQueryDTO,
  client: DbTransaction,
) {
  const conditions = [];
  if (query.q) {
    const pattern = `%${query.q}%`;
    conditions.push(
      or(
        ilike(customers.fullName, pattern),
        ilike(customers.phone, pattern),
        ilike(customers.phoneSecondary, pattern),
      ),
    );
  }

  const whereExpr = conditions.length > 0 ? and(...conditions) : undefined;

  const countRow = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(customers)
    .where(whereExpr);
  const total = countRow[0]?.count ?? 0;

  const rows = await client
    .select(customerSelect)
    .from(customers)
    .where(whereExpr)
    .orderBy(customers.fullName)
    .limit(query.limit)
    .offset(query.offset);

  return {
    data: rows,
    meta: { total, limit: query.limit, offset: query.offset },
  };
}

export async function getCustomerRecordById(id: string, client: DbTransaction) {
  const rows = await client
    .select(customerSelect)
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function insertCustomer(
  values: typeof customers.$inferInsert,
  client: DbTransaction,
) {
  const [created] = await client
    .insert(customers)
    .values(values)
    .returning(customerSelect);
  return created ?? null;
}

export async function updateCustomerById(
  id: string,
  values: Partial<typeof customers.$inferInsert>,
  client: DbTransaction,
) {
  const [updated] = await client
    .update(customers)
    .set(values)
    .where(eq(customers.id, id))
    .returning(customerSelect);
  return updated ?? null;
}
