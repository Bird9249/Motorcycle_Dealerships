import { AppError } from "@/shared/errors";
import type { DbTransaction } from "@/shared/types";
import type { UpsertExchangeRatesDTO } from "../contracts";
import { upsertExchangeRate } from "../repo/exchange-rates-admin";

function formatRate(value: string | number): string {
  const num = typeof value === "number" ? value : Number.parseFloat(value);
  return num.toFixed(6);
}

function serializeRate(row: {
  id: string;
  baseCurrency: string;
  targetCurrency: string;
  rate: string;
  effectiveDate: Date;
}) {
  return {
    ...row,
    effectiveDate: row.effectiveDate.toISOString().slice(0, 10),
  };
}

export async function upsertExchangeRatesService(
  client: DbTransaction,
  params: { input: UpsertExchangeRatesDTO },
) {
  const effectiveDate = new Date(params.input.effectiveDate);
  const pairs = [
    { targetCurrency: "LAK" as const, rate: formatRate(params.input.lakRate) },
    { targetCurrency: "THB" as const, rate: formatRate(params.input.thbRate) },
  ];

  const upserted = [];
  for (const pair of pairs) {
    const row = await upsertExchangeRate(
      {
        baseCurrency: "USD",
        targetCurrency: pair.targetCurrency,
        rate: pair.rate,
        effectiveDate,
      },
      client,
    );
    if (!row) {
      throw new AppError("CREATE_FAILED", "Failed to upsert exchange rate");
    }
    upserted.push(serializeRate(row));
  }

  return { upserted };
}
