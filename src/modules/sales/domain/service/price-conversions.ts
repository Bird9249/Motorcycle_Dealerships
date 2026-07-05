import { AppError } from "@/shared/errors";
import type { DbTransaction } from "@/shared/types";
import type { ConvertCurrencyDTO } from "../contracts";
import {
  getExchangeRateMap,
  type SaleCurrency,
} from "../repo/exchange-rates";
import { getSalesOrderById } from "../repo/sales-orders";
import {
  buildPriceConversions,
  buildRateMapFromSnapshot,
  convertCurrencyAmount,
} from "./convert-currency";

export async function convertCurrencyService(
  client: DbTransaction,
  input: ConvertCurrencyDTO,
) {
  const rates = await getExchangeRateMap(client);
  const amount = convertCurrencyAmount({
    amount: input.amount,
    fromCurrency: input.fromCurrency,
    toCurrency: input.toCurrency,
    rates,
  });

  return {
    amount,
    fromCurrency: input.fromCurrency,
    toCurrency: input.toCurrency,
    rateEffectiveDate: rates.effectiveDate,
  };
}

export async function getOrderPriceConversionsService(
  client: DbTransaction,
  orderId: string,
) {
  const order = await getSalesOrderById(orderId, client);
  if (!order) {
    throw new AppError("NOT_FOUND", "Sales order not found");
  }

  const asOf = order.soldAt ?? undefined;
  const latestRates = await getExchangeRateMap(client, asOf);
  const rates =
    order.status === "confirmed" || order.status === "completed"
      ? buildRateMapFromSnapshot({
          saleCurrency: order.saleCurrency,
          exchangeRateUsed: order.exchangeRateUsed,
          latestRates,
        })
      : latestRates;

  const conversions = buildPriceConversions({
    amount: order.salePrice,
    primaryCurrency: order.saleCurrency,
    rates,
  });

  return {
    salePrice: order.salePrice,
    saleCurrency: order.saleCurrency,
    exchangeRateUsed: order.exchangeRateUsed,
    rateEffectiveDate: rates.effectiveDate,
    conversions,
  };
}

export async function previewPriceConversionsService(
  client: DbTransaction,
  params: {
    amount: string | number;
    saleCurrency: SaleCurrency;
  },
) {
  const rates = await getExchangeRateMap(client);
  const conversions = buildPriceConversions({
    amount: params.amount,
    primaryCurrency: params.saleCurrency,
    rates,
  });

  const exchangeRateUsed =
    params.saleCurrency === "USD"
      ? null
      : params.saleCurrency === "LAK"
        ? rates.usdToLak?.toFixed(6) ?? null
        : rates.usdToThb?.toFixed(6) ?? null;

  return {
    salePrice:
      typeof params.amount === "number"
        ? params.amount.toFixed(2)
        : params.amount,
    saleCurrency: params.saleCurrency,
    exchangeRateUsed,
    rateEffectiveDate: rates.effectiveDate,
    conversions,
  };
}
