import { AppError } from "@/shared/errors";
import type { ExchangeRateMap, SaleCurrency } from "../repo/exchange-rates";

const ALL_CURRENCIES: SaleCurrency[] = ["LAK", "THB", "USD"];

export function parseMoney(value: string | number): number {
  return typeof value === "number" ? value : Number.parseFloat(value);
}

export function formatMoney(value: number): string {
  return value.toFixed(2);
}

function assertRateAvailable(
  currency: SaleCurrency,
  rates: ExchangeRateMap,
): number | null {
  if (currency === "USD") return null;
  if (currency === "LAK") {
    if (!rates.usdToLak) {
      throw new AppError(
        "VALIDATION_EXCHANGE_RATE",
        "Exchange rate USD→LAK is not configured",
      );
    }
    return rates.usdToLak;
  }
  if (!rates.usdToThb) {
    throw new AppError(
      "VALIDATION_EXCHANGE_RATE",
      "Exchange rate USD→THB is not configured",
    );
  }
  return rates.usdToThb;
}

function amountToUsd(
  amount: number,
  currency: SaleCurrency,
  rates: ExchangeRateMap,
): number {
  if (currency === "USD") return amount;
  const rate = assertRateAvailable(currency, rates)!;
  return amount / rate;
}

function amountFromUsd(
  amountUsd: number,
  currency: SaleCurrency,
  rates: ExchangeRateMap,
): number {
  if (currency === "USD") return amountUsd;
  const rate = assertRateAvailable(currency, rates)!;
  return amountUsd * rate;
}

export function convertCurrencyAmount(params: {
  amount: string | number;
  fromCurrency: SaleCurrency;
  toCurrency: SaleCurrency;
  rates: ExchangeRateMap;
}): string {
  const { fromCurrency, toCurrency, rates } = params;
  if (fromCurrency === toCurrency) {
    return formatMoney(parseMoney(params.amount));
  }

  const usd = amountToUsd(parseMoney(params.amount), fromCurrency, rates);
  const converted = amountFromUsd(usd, toCurrency, rates);
  return formatMoney(converted);
}

export type PriceConversionItem = {
  currency: SaleCurrency;
  amount: string;
  isPrimary: boolean;
};

export function buildPriceConversions(params: {
  amount: string | number;
  primaryCurrency: SaleCurrency;
  rates: ExchangeRateMap;
}): PriceConversionItem[] {
  const { amount, primaryCurrency, rates } = params;

  return ALL_CURRENCIES.map((currency) => ({
    currency,
    amount: convertCurrencyAmount({
      amount,
      fromCurrency: primaryCurrency,
      toCurrency: currency,
      rates,
    }),
    isPrimary: currency === primaryCurrency,
  }));
}

export function buildRateMapFromSnapshot(params: {
  saleCurrency: SaleCurrency;
  exchangeRateUsed: string | null;
  latestRates: ExchangeRateMap;
}): ExchangeRateMap {
  const { saleCurrency, exchangeRateUsed, latestRates } = params;

  if (!exchangeRateUsed || saleCurrency === "USD") {
    return latestRates;
  }

  const snapshotRate = Number.parseFloat(exchangeRateUsed);
  return {
    usdToLak:
      saleCurrency === "LAK" ? snapshotRate : latestRates.usdToLak,
    usdToThb:
      saleCurrency === "THB" ? snapshotRate : latestRates.usdToThb,
    effectiveDate: latestRates.effectiveDate,
  };
}
