import { desc, eq } from "drizzle-orm";
import {
  exchangeRates,
  financeCompanies,
} from "@/server/platform/db/schema/sales";
import type { DbTransaction } from "@/shared/types";

export async function listActiveFinanceCompanies(client: DbTransaction) {
  return client
    .select({
      id: financeCompanies.id,
      name: financeCompanies.name,
      code: financeCompanies.code,
      contactPhone: financeCompanies.contactPhone,
      isActive: financeCompanies.isActive,
    })
    .from(financeCompanies)
    .where(eq(financeCompanies.isActive, true))
    .orderBy(financeCompanies.name);
}

export async function listLatestExchangeRates(client: DbTransaction) {
  const rows = await client
    .select({
      id: exchangeRates.id,
      baseCurrency: exchangeRates.baseCurrency,
      targetCurrency: exchangeRates.targetCurrency,
      rate: exchangeRates.rate,
      effectiveDate: exchangeRates.effectiveDate,
    })
    .from(exchangeRates)
    .orderBy(
      exchangeRates.targetCurrency,
      desc(exchangeRates.effectiveDate),
      desc(exchangeRates.createdAt),
    );

  const seen = new Set<string>();
  const latest = [];
  for (const row of rows) {
    const key = `${row.baseCurrency}:${row.targetCurrency}`;
    if (seen.has(key)) continue;
    seen.add(key);
    latest.push(row);
  }

  return latest;
}
