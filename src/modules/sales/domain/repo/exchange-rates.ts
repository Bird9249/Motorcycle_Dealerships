import { and, desc, eq, lte } from "drizzle-orm";
import { exchangeRates } from "@/server/platform/db/schema/sales";
import type { DbTransaction } from "@/shared/types";

export type SaleCurrency = "LAK" | "THB" | "USD";

export type ExchangeRateMap = {
  usdToLak: number | null;
  usdToThb: number | null;
  effectiveDate: string | null;
};

async function queryRates(
  client: DbTransaction,
  asOf?: Date,
) {
  const conditions = [eq(exchangeRates.baseCurrency, "USD")];
  if (asOf) {
    conditions.push(lte(exchangeRates.effectiveDate, asOf));
  }

  return client
    .select({
      targetCurrency: exchangeRates.targetCurrency,
      rate: exchangeRates.rate,
      effectiveDate: exchangeRates.effectiveDate,
    })
    .from(exchangeRates)
    .where(and(...conditions))
    .orderBy(
      exchangeRates.targetCurrency,
      desc(exchangeRates.effectiveDate),
      desc(exchangeRates.createdAt),
    );
}

function rowsToRateMap(
  rows: Array<{
    targetCurrency: "LAK" | "THB" | "USD";
    rate: string;
    effectiveDate: string;
  }>,
): ExchangeRateMap {
  const map: ExchangeRateMap = {
    usdToLak: null,
    usdToThb: null,
    effectiveDate: null,
  };

  for (const row of rows) {
    if (row.targetCurrency === "LAK" && map.usdToLak === null) {
      map.usdToLak = Number.parseFloat(row.rate);
      map.effectiveDate = row.effectiveDate;
    }
    if (row.targetCurrency === "THB" && map.usdToThb === null) {
      map.usdToThb = Number.parseFloat(row.rate);
      if (!map.effectiveDate) map.effectiveDate = row.effectiveDate;
    }
  }

  return map;
}

export async function getExchangeRateMap(
  client: DbTransaction,
  asOf?: Date,
): Promise<ExchangeRateMap> {
  const rows = await queryRates(client, asOf);
  return rowsToRateMap(rows);
}

export async function resolveSnapshotRateForCurrency(
  client: DbTransaction,
  saleCurrency: SaleCurrency,
  asOf?: Date,
): Promise<string | null> {
  if (saleCurrency === "USD") return null;

  const map = await getExchangeRateMap(client, asOf);
  const rate =
    saleCurrency === "LAK"
      ? map.usdToLak
      : saleCurrency === "THB"
        ? map.usdToThb
        : null;

  if (rate === null) return null;
  return rate.toFixed(6);
}
