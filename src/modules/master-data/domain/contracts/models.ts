import { z } from "zod";
import { ActiveFilterSchema } from "./common";

export const VehicleTypeSchema = z.enum(["ice", "ev"]);

const priceSchema = z.union([
  z.string().regex(/^\d+(\.\d{1,2})?$/),
  z.number().nonnegative(),
]);

export const ModelSchema = z.object({
  id: z.string(),
  brandId: z.string(),
  name: z.string(),
  vehicleType: VehicleTypeSchema,
  engineCc: z.number().nullable(),
  batteryCapacityKwh: z.string().nullable(),
  year: z.number().nullable(),
  isActive: z.boolean(),
  vehicleCount: z.number().int().nonnegative(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  brand: z
    .object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      isActive: z.boolean(),
    })
    .optional(),
});

export const ModelsListQuerySchema = z.object({
  brandId: z.string().min(1).optional(),
  vehicleType: VehicleTypeSchema.optional(),
  active: ActiveFilterSchema,
  name: z.string().trim().optional(),
});

export const CreateModelSchema = z.object({
  brandId: z.string().min(1),
  name: z.string().trim().min(1, "ຕ້ອງໃສ່ຊື່ລຸ່ນ"),
  vehicleType: VehicleTypeSchema,
  engineCc: z.number().int().positive().optional().nullable(),
  batteryCapacityKwh: priceSchema.optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const UpdateModelSchema = CreateModelSchema.partial().omit({
  brandId: true,
});

export type ModelDTO = z.infer<typeof ModelSchema>;
export type ModelsListQueryDTO = z.infer<typeof ModelsListQuerySchema>;
export type CreateModelDTO = z.infer<typeof CreateModelSchema>;
export type UpdateModelDTO = z.infer<typeof UpdateModelSchema>;
