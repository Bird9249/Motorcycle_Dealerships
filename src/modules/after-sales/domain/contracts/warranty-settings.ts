import { z } from "zod";

export const WarrantySettingsSchema = z.object({
  id: z.string(),
  vehicleMonths: z.number().int().min(1).max(120),
  motorMonths: z.number().int().min(1).max(120),
  batteryMonths: z.number().int().min(1).max(120),
  updatedAt: z.coerce.date(),
});

export const UpdateWarrantySettingsSchema = z.object({
  vehicleMonths: z.number().int().min(1).max(120),
  motorMonths: z.number().int().min(1).max(120),
  batteryMonths: z.number().int().min(1).max(120),
});

export type WarrantySettingsDTO = z.infer<typeof WarrantySettingsSchema>;
export type UpdateWarrantySettingsDTO = z.infer<
  typeof UpdateWarrantySettingsSchema
>;

export const DEFAULT_WARRANTY_SETTINGS = {
  vehicleMonths: 24,
  motorMonths: 12,
  batteryMonths: 36,
} as const;
