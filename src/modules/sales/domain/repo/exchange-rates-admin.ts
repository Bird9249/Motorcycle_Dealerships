import { and, desc, eq } from "drizzle-orm";
import { exchangeRates } from "@/server/platform/db/schema/sales";
import type { DbTransaction } from "@/shared/types";

export async function upsertExchangeRate(
  values: {
    baseCurrency: "USD";
    targetCurrency: "LAK" | "THB";
    rate: string;
    effectiveDate: Date;
  },
  client: DbTransaction,
) {
  const [row] = await client
    .insert(exchangeRates)
    .values({
      baseCurrency: values.baseCurrency,
      targetCurrency: values.targetCurrency,
      rate: values.rate,
      effectiveDate: values.effectiveDate,
      createdAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        exchangeRates.baseCurrency,
        exchangeRates.targetCurrency,
        exchangeRates.effectiveDate,
      ],
      set: {
        rate: values.rate,
      },
    })
    .returning({
      id: exchangeRates.id,
      baseCurrency: exchangeRates.baseCurrency,
      targetCurrency: exchangeRates.targetCurrency,
      rate: exchangeRates.rate,
      effectiveDate: exchangeRates.effectiveDate,
    });
  return row ?? null;
}

export async function findExchangeRatesByDate(
  effectiveDate: Date,
  client: DbTransaction,
) {
  return client
    .select({
      id: exchangeRates.id,
      baseCurrency: exchangeRates.baseCurrency,
      targetCurrency: exchangeRates.targetCurrency,
      rate: exchangeRates.rate,
      effectiveDate: exchangeRates.effectiveDate,
    })
    .from(exchangeRates)
    .where(
      and(
        eq(exchangeRates.baseCurrency, "USD"),
        eq(exchangeRates.effectiveDate, effectiveDate),
      ),
    );
}

export async function insertExchangeRate(
  values: typeof exchangeRates.$inferInsert,
  client: DbTransaction,
) {
  const [created] = await client
    .insert(exchangeRates)
    .values(values)
    .returning({
      id: exchangeRates.id,
      baseCurrency: exchangeRates.baseCurrency,
      targetCurrency: exchangeRates.targetCurrency,
      rate: exchangeRates.rate,
      effectiveDate: exchangeRates.effectiveDate,
    });
  return created ?? null;
}

export async function findExchangeRateByPairDate(
  params: {
    baseCurrency: string;
    targetCurrency: string;
    effectiveDate: Date;
  },
  client: DbTransaction,
) {
  const rows = await client
    .select({ id: exchangeRates.id })
    .from(exchangeRates)
    .where(
      and(
        eq(exchangeRates.baseCurrency, params.baseCurrency as "USD"),
        eq(
          exchangeRates.targetCurrency,
          params.targetCurrency as "LAK" | "THB" | "USD",
        ),
        eq(exchangeRates.effectiveDate, params.effectiveDate),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function listExchangeRateHistory(client: DbTransaction) {
  return client
    .select({
      id: exchangeRates.id,
      baseCurrency: exchangeRates.baseCurrency,
      targetCurrency: exchangeRates.targetCurrency,
      rate: exchangeRates.rate,
      effectiveDate: exchangeRates.effectiveDate,
      createdAt: exchangeRates.createdAt,
    })
    .from(exchangeRates)
    .orderBy(
      desc(exchangeRates.effectiveDate),
      exchangeRates.targetCurrency,
      desc(exchangeRates.createdAt),
    );
}
