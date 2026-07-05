import { eq } from "drizzle-orm";
import { customers } from "@/server/platform/db/schema/customers";
import { financeCompanies } from "@/server/platform/db/schema/sales";
import type { DbTransaction } from "@/shared/types";

export async function getCustomerById(id: string, client: DbTransaction) {
  const rows = await client
    .select({
      id: customers.id,
      fullName: customers.fullName,
      phone: customers.phone,
    })
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getFinanceCompanyById(
  id: string,
  client: DbTransaction,
) {
  const rows = await client
    .select({
      id: financeCompanies.id,
      name: financeCompanies.name,
      code: financeCompanies.code,
      isActive: financeCompanies.isActive,
    })
    .from(financeCompanies)
    .where(eq(financeCompanies.id, id))
    .limit(1);
  return rows[0] ?? null;
}
