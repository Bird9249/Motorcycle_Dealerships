import { z } from "zod";
import { CurrencySchema, priceSchema, rateSchema } from "./common";

export const PaymentSchedulePreviewItemSchema = z.object({
  installmentNumber: z.number().int().positive(),
  dueDate: z.string(),
  amount: z.string(),
  currency: CurrencySchema,
  status: z.literal("pending"),
});

export const PaymentSchedulePreviewSchema = z.object({
  monthlyInstallment: z.string(),
  totalFinanced: z.string(),
  totalInterest: z.string(),
  schedules: z.array(PaymentSchedulePreviewItemSchema),
});

export const PreviewScheduleBodySchema = z.object({
  salePrice: priceSchema.optional(),
  downPayment: priceSchema.optional().nullable(),
  installmentMonths: z.number().int().positive().optional(),
  interestRatePercent: rateSchema.optional().nullable(),
  saleCurrency: CurrencySchema.optional(),
});

/** Stateless preview — ไม่ต้องมี order ใน DB */
export const PreviewScheduleStandaloneSchema = z.object({
  salePrice: priceSchema,
  downPayment: priceSchema.optional().nullable(),
  installmentMonths: z.number().int().positive(),
  interestRatePercent: rateSchema,
  saleCurrency: CurrencySchema.default("LAK"),
});

export const UpdateFinanceTransferSchema = z.object({
  financeTransferReceived: z.boolean(),
  financeTransferDate: z.iso.date().optional().nullable(),
});

export const FinanceCompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  contactPhone: z.string().nullable(),
  isActive: z.boolean(),
});

export const ExchangeRateSchema = z.object({
  id: z.string(),
  baseCurrency: CurrencySchema,
  targetCurrency: CurrencySchema,
  rate: z.string(),
  effectiveDate: z.string(),
});

export const CreateExchangeRateSchema = z.object({
  baseCurrency: CurrencySchema.default("USD"),
  targetCurrency: z.enum(["LAK", "THB"]),
  rate: rateSchema,
  effectiveDate: z.iso.date(),
});

/** Bulk upsert — USD→LAK + USD→THB สำหรับวันที่เดียวกัน */
export const UpsertExchangeRatesSchema = z.object({
  effectiveDate: z.iso.date(),
  lakRate: rateSchema,
  thbRate: rateSchema,
});

export const CreateFinanceCompanySchema = z.object({
  name: z.string().trim().min(1, "ຕ້ອງໃສ່ຊື່"),
  code: z
    .string()
    .trim()
    .min(1, "ຕ້ອງໃສ່ລະຫັດ")
    .regex(/^[A-Za-z0-9_-]+$/, "ລະຫັດບໍ່ຖືກຕ້ອງ"),
  contactPhone: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const UpdateFinanceCompanySchema = CreateFinanceCompanySchema.partial();

export const UpdateFinanceCompanyStatusSchema = z.object({
  isActive: z.boolean(),
});

export const FinanceCompaniesListQuerySchema = z.object({
  active: z.enum(["all", "true", "false"]).optional(),
  q: z.string().trim().optional(),
});

export type PreviewScheduleBodyDTO = z.infer<typeof PreviewScheduleBodySchema>;
export type PreviewScheduleStandaloneDTO = z.infer<
  typeof PreviewScheduleStandaloneSchema
>;
export type CreateExchangeRateDTO = z.infer<typeof CreateExchangeRateSchema>;
export type UpsertExchangeRatesDTO = z.infer<typeof UpsertExchangeRatesSchema>;
export type CreateFinanceCompanyDTO = z.infer<typeof CreateFinanceCompanySchema>;
export type UpdateFinanceCompanyDTO = z.infer<typeof UpdateFinanceCompanySchema>;
export type FinanceCompaniesListQueryDTO = z.infer<
  typeof FinanceCompaniesListQuerySchema
>;
export type PaymentSchedulePreviewDTO = z.infer<
  typeof PaymentSchedulePreviewSchema
>;
export type UpdateFinanceTransferDTO = z.infer<
  typeof UpdateFinanceTransferSchema
>;
