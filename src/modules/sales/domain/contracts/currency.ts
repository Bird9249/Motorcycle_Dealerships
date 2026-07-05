import { z } from "zod";
import { CurrencySchema, priceSchema } from "./common";

export const ConvertCurrencySchema = z.object({
  amount: priceSchema,
  fromCurrency: CurrencySchema,
  toCurrency: CurrencySchema,
});

export const PreviewPriceConversionsSchema = z.object({
  amount: priceSchema,
  saleCurrency: CurrencySchema.default("LAK"),
});

export const PriceConversionItemSchema = z.object({
  currency: CurrencySchema,
  amount: z.string(),
  isPrimary: z.boolean(),
});

export const PriceConversionsResponseSchema = z.object({
  salePrice: z.string(),
  saleCurrency: CurrencySchema,
  exchangeRateUsed: z.string().nullable(),
  rateEffectiveDate: z.string().nullable(),
  conversions: z.array(PriceConversionItemSchema),
});

export type ConvertCurrencyDTO = z.infer<typeof ConvertCurrencySchema>;
export type PreviewPriceConversionsDTO = z.infer<
  typeof PreviewPriceConversionsSchema
>;
export type PriceConversionsResponseDTO = z.infer<
  typeof PriceConversionsResponseSchema
>;
