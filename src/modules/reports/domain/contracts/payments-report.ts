import { z } from "zod";
import { CurrencySchema } from "@/modules/sales/domain/contracts";
import { DateRangeQuerySchema } from "./common";
import { SalesReportPeriodSchema } from "./sales-report";

export const PaymentsReportQuerySchema = DateRangeQuerySchema.extend({
  period: SalesReportPeriodSchema.optional(),
});

const VerifiedByAccountSchema = z.object({
  accountId: z.string(),
  name: z.string(),
  currency: CurrencySchema,
  total: z.string(),
  count: z.number().int(),
});

const VerifiedByCurrencySchema = z.object({
  currency: CurrencySchema,
  totalAmount: z.string(),
  count: z.number().int(),
});

export const PaymentsReportSchema = z.object({
  period: z.object({
    dateFrom: z.string(),
    dateTo: z.string(),
    preset: SalesReportPeriodSchema,
  }),
  pendingCount: z.number().int(),
  verifiedByAccount: z.array(VerifiedByAccountSchema),
  verifiedByCurrency: z.array(VerifiedByCurrencySchema),
});

export type PaymentsReportQueryDTO = z.infer<typeof PaymentsReportQuerySchema>;
export type PaymentsReportDTO = z.infer<typeof PaymentsReportSchema>;
