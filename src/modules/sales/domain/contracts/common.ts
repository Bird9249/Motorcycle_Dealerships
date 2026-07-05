import { z } from "zod";

export const IdParamSchema = z.object({ id: z.string().min(1) });

export const SalePaymentTypeSchema = z.enum([
  "cash",
  "bank_finance",
  "in_house_leasing",
]);

export const SalesOrderStatusSchema = z.enum([
  "draft",
  "confirmed",
  "completed",
  "cancelled",
]);

export const CurrencySchema = z.enum(["LAK", "THB", "USD"]);

export const priceSchema = z.union([
  z.string().regex(/^\d+(\.\d{1,2})?$/),
  z.number().nonnegative(),
]);

export const rateSchema = z.union([
  z.string().regex(/^\d+(\.\d{1,6})?$/),
  z.number().nonnegative(),
]);
