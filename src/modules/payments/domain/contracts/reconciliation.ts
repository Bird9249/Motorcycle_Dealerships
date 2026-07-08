import { z } from "zod";
import { priceSchema } from "./payments";

export const ReconciliationStatusSchema = z.enum([
  "open",
  "balanced",
  "discrepancy",
]);

export const ReconciliationQuerySchema = z.object({
  date: z.coerce.date(),
});

export const ReconciliationDateParamSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const UpsertReconciliationItemSchema = z.object({
  paymentAccountId: z.string().min(1),
  actualAmount: priceSchema,
  notes: z.string().trim().optional().nullable(),
});

export const UpsertReconciliationSchema = z.object({
  reconciliationDate: z.coerce.date(),
  items: z.array(UpsertReconciliationItemSchema).min(1),
});

export type ReconciliationQueryDTO = z.infer<typeof ReconciliationQuerySchema>;
export type UpsertReconciliationDTO = z.infer<typeof UpsertReconciliationSchema>;
