import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import type { CreateExchangeRateDTO } from "../contracts";
import {
  findExchangeRateByPairDate,
  insertExchangeRate,
} from "../repo/exchange-rates-admin";

function formatRate(value: string | number): string {
  const num = typeof value === "number" ? value : Number.parseFloat(value);
  return num.toFixed(6);
}

export async function createExchangeRateService(
  client: DbTransaction,
  params: { input: CreateExchangeRateDTO },
) {
  const effectiveDate = new Date(params.input.effectiveDate);
  const conflict = await findExchangeRateByPairDate(
    {
      baseCurrency: params.input.baseCurrency,
      targetCurrency: params.input.targetCurrency,
      effectiveDate,
    },
    client,
  );

  if (conflict) {
    throw new AppError(
      "CONFLICT",
      "Exchange rate for this currency pair and date already exists",
    );
  }

  const created = await insertExchangeRate(
    {
      baseCurrency: params.input.baseCurrency,
      targetCurrency: params.input.targetCurrency,
      rate: formatRate(params.input.rate),
      effectiveDate,
      createdAt: nowDate(),
    },
    client,
  );

  if (!created) {
    throw new AppError("CREATE_FAILED", "Failed to create exchange rate");
  }

  return {
    created: {
      ...created,
      effectiveDate: created.effectiveDate.toISOString().slice(0, 10),
    },
  };
}
