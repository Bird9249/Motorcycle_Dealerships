import { z } from "zod";

export const ReportPeriodSchema = z.enum(["day", "week", "month"]);

export const DateRangeQuerySchema = z.object({
  dateFrom: z.iso.date().optional(),
  dateTo: z.iso.date().optional(),
  period: ReportPeriodSchema.optional(),
});

export type ReportPeriod = z.infer<typeof ReportPeriodSchema>;
export type DateRangeQueryDTO = z.infer<typeof DateRangeQuerySchema>;
