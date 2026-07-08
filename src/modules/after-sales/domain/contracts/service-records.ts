import { z } from "zod";
import { OffsetPageQuerySchema } from "@/shared/contracts/base";

export const ServiceTypeSchema = z.enum([
  "oil_change",
  "battery_check",
  "electrical_check",
  "general",
]);

export const ServiceRecordSchema = z.object({
  id: z.string(),
  vehicleId: z.string(),
  customerId: z.string(),
  serviceType: ServiceTypeSchema,
  odometerKm: z.number().int().nullable(),
  description: z.string(),
  performedAt: z.coerce.date(),
  performedBy: z.string(),
  batteryHealthPercent: z.number().int().nullable(),
  batteryNotes: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const ServiceRecordListItemSchema = ServiceRecordSchema.extend({
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
    vehicleType: z.enum(["ice", "ev"]),
  }),
  performedByUser: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export const CreateServiceRecordSchema = z.object({
  vehicleId: z.string().min(1, "ຕ້ອງເລືອກລົດ"),
  customerId: z.string().min(1, "ຕ້ອງເລືອກລູກຄ້າ"),
  serviceType: ServiceTypeSchema,
  odometerKm: z.coerce.number().int().nonnegative().optional().nullable(),
  description: z.string().trim().min(1, "ຕ້ອງລະບຸລາຍລະອຽດ"),
  performedAt: z.coerce.date().optional(),
  batteryHealthPercent: z.coerce
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .nullable(),
  batteryNotes: z.string().trim().optional().nullable(),
});

export const ServiceRecordsListQuerySchema = OffsetPageQuerySchema.extend({
  vehicleId: z.string().trim().optional(),
  customerId: z.string().trim().optional(),
});

export const VehicleHistoryParamSchema = z.object({
  vehicleId: z.string().min(1),
});

export type ServiceType = z.infer<typeof ServiceTypeSchema>;
export type ServiceRecordDTO = z.infer<typeof ServiceRecordSchema>;
export type ServiceRecordListItemDTO = z.infer<
  typeof ServiceRecordListItemSchema
>;
export type CreateServiceRecordDTO = z.infer<typeof CreateServiceRecordSchema>;
export type ServiceRecordsListQueryDTO = z.infer<
  typeof ServiceRecordsListQuerySchema
>;
