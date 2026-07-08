import { z } from "zod";
import {
  CurrencySchema,
  SalePaymentTypeSchema,
  SalesOrderStatusSchema,
} from "@/modules/sales/domain/contracts";
import { OffsetPageQuerySchema } from "@/shared/contracts/base";
import { DateRangeQuerySchema, ReportPeriodSchema } from "./common";

export const SalesReportPeriodSchema = ReportPeriodSchema.or(
  z.literal("custom"),
);

export const SalesReportQuerySchema = OffsetPageQuerySchema.extend({
  dateFrom: DateRangeQuerySchema.shape.dateFrom,
  dateTo: DateRangeQuerySchema.shape.dateTo,
  period: SalesReportPeriodSchema.optional(),
});

const CountByStatusSchema = z.object({
  status: SalesOrderStatusSchema,
  count: z.number().int(),
});

const CountByPaymentTypeSchema = z.object({
  paymentType: SalePaymentTypeSchema,
  count: z.number().int(),
});

const AmountByCurrencySchema = z.object({
  currency: CurrencySchema,
  totalAmount: z.string(),
  count: z.number().int(),
});

export const SalesReportItemSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  salePrice: z.string(),
  saleCurrency: CurrencySchema,
  paymentType: SalePaymentTypeSchema,
  status: SalesOrderStatusSchema,
  soldAt: z.string().nullable(),
  createdAt: z.string(),
  customer: z.object({
    fullName: z.string(),
    phone: z.string(),
  }),
  vehicle: z.object({
    brandName: z.string(),
    modelName: z.string(),
    chassisNumber: z.string().nullable(),
  }),
});

export const SalesReportSchema = z.object({
  period: z.object({
    dateFrom: z.string(),
    dateTo: z.string(),
    preset: SalesReportPeriodSchema,
  }),
  summary: z.object({
    totalOrders: z.number().int(),
    byStatus: z.array(CountByStatusSchema),
    byPaymentType: z.array(CountByPaymentTypeSchema),
    byCurrency: z.array(AmountByCurrencySchema),
  }),
  data: z.array(SalesReportItemSchema),
  meta: z.object({
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
  }),
});

export type SalesReportQueryDTO = z.infer<typeof SalesReportQuerySchema>;
export type SalesReportDTO = z.infer<typeof SalesReportSchema>;
export type SalesReportItemDTO = z.infer<typeof SalesReportItemSchema>;
