import { z } from "zod";
import { DateRangeQuerySchema } from "./common";

export const DashboardQuerySchema = DateRangeQuerySchema.extend({
  period: DateRangeQuerySchema.shape.period.default("month"),
});

const CurrencyAmountSchema = z.object({
  currency: z.enum(["LAK", "THB", "USD"]),
  totalAmount: z.string(),
  count: z.number().int(),
});

const PaymentTypeCountSchema = z.object({
  paymentType: z.string(),
  count: z.number().int(),
});

const VerifiedAccountSchema = z.object({
  accountId: z.string(),
  name: z.string(),
  total: z.string(),
  currency: z.enum(["LAK", "THB", "USD"]),
});

const SalesByDaySchema = z.object({
  date: z.string(),
  count: z.number().int(),
  amountByCurrency: z.record(z.string(), z.string()),
});

const RecentSaleSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  customerName: z.string(),
  salePrice: z.string(),
  saleCurrency: z.enum(["LAK", "THB", "USD"]),
  status: z.enum(["draft", "confirmed", "completed", "cancelled"]),
  soldAt: z.string().nullable(),
  createdAt: z.string(),
});

export const DashboardKpisSchema = z.object({
  period: z.object({
    dateFrom: z.string(),
    dateTo: z.string(),
    preset: z.enum(["day", "week", "month"]),
  }),
  inventory: z.object({
    inStock: z.number().int(),
    reserved: z.number().int(),
    sold: z.number().int(),
    inService: z.number().int(),
    evCount: z.number().int(),
    iceCount: z.number().int(),
  }),
  sales: z.object({
    confirmedCount: z.number().int(),
    completedCount: z.number().int(),
    byCurrency: z.array(CurrencyAmountSchema),
    byPaymentType: z.array(PaymentTypeCountSchema),
  }),
  payments: z.object({
    pendingCount: z.number().int(),
    verifiedInPeriodByCurrency: z.array(CurrencyAmountSchema),
    verifiedTodayByAccount: z.array(VerifiedAccountSchema),
  }),
  afterSales: z.object({
    warrantiesExpiring30: z.number().int(),
    serviceRecordsInPeriod: z.number().int(),
  }),
  trends: z.object({
    salesByDay: z.array(SalesByDaySchema),
  }),
  recentSales: z.array(RecentSaleSchema),
});

export type DashboardQueryDTO = z.infer<typeof DashboardQuerySchema>;
export type DashboardKpisDTO = z.infer<typeof DashboardKpisSchema>;
