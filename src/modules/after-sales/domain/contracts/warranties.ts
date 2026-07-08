import { z } from "zod";
import { OffsetPageQuerySchema } from "@/shared/contracts/base";

export const WarrantyTypeSchema = z.enum(["vehicle", "motor", "battery"]);
export const WarrantyStatusSchema = z.enum([
  "active",
  "expired",
  "claimed",
  "voided",
]);

export const WarrantySchema = z.object({
  id: z.string(),
  vehicleId: z.string(),
  customerId: z.string(),
  salesOrderId: z.string(),
  warrantyType: WarrantyTypeSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  durationMonths: z.number().int(),
  batterySerialNumber: z.string().nullable(),
  status: WarrantyStatusSchema,
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const WarrantyListItemSchema = WarrantySchema.extend({
  daysRemaining: z.number().int(),
  customer: z.object({
    id: z.string(),
    fullName: z.string(),
    phone: z.string(),
  }),
  vehicle: z.object({
    id: z.string(),
    chassisNumber: z.string().nullable(),
    modelName: z.string(),
    brandName: z.string(),
  }),
  salesOrder: z.object({
    id: z.string(),
    orderNumber: z.string(),
  }),
});

export const WarrantiesListQuerySchema = OffsetPageQuerySchema.extend({
  warrantyType: WarrantyTypeSchema.optional(),
  status: WarrantyStatusSchema.optional(),
  expiringSoon: z.enum(["true"]).optional(),
  salesOrderId: z.string().trim().optional(),
});

export const ExpiringWarrantiesQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type WarrantyType = z.infer<typeof WarrantyTypeSchema>;
export type WarrantyStatus = z.infer<typeof WarrantyStatusSchema>;
export type WarrantyDTO = z.infer<typeof WarrantySchema>;
export type WarrantyListItemDTO = z.infer<typeof WarrantyListItemSchema>;
export type WarrantiesListQueryDTO = z.infer<typeof WarrantiesListQuerySchema>;
export type ExpiringWarrantiesQueryDTO = z.infer<
  typeof ExpiringWarrantiesQuerySchema
>;
