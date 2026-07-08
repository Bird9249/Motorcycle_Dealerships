import { z } from "zod";
import { ServiceTypeSchema, WarrantyListItemSchema } from "@/modules/after-sales/domain/contracts";
import { DateRangeQuerySchema } from "./common";
import { SalesReportPeriodSchema } from "./sales-report";

export const AfterSalesReportQuerySchema = DateRangeQuerySchema.extend({
  period: SalesReportPeriodSchema.optional(),
  expiringDays: z.coerce.number().int().min(1).max(365).default(30),
  expiringLimit: z.coerce.number().int().min(1).max(100).default(20),
});

const ServiceTypeCountSchema = z.object({
  serviceType: ServiceTypeSchema,
  count: z.number().int(),
});

export const AfterSalesReportSchema = z.object({
  period: z.object({
    dateFrom: z.string(),
    dateTo: z.string(),
    preset: SalesReportPeriodSchema,
  }),
  expiringWarranties: z.object({
    days: z.number().int(),
    count: z.number().int(),
    items: z.array(WarrantyListItemSchema),
  }),
  serviceByType: z.array(ServiceTypeCountSchema),
  serviceRecordsInPeriod: z.number().int(),
});

export type AfterSalesReportQueryDTO = z.infer<
  typeof AfterSalesReportQuerySchema
>;
export type AfterSalesReportDTO = z.infer<typeof AfterSalesReportSchema>;
