import { z } from "zod";
import { ActiveFilterSchema } from "./common";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric");

export const BrandSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  isActive: z.boolean(),
  modelCount: z.number().int().nonnegative(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const BrandsListQuerySchema = z.object({
  active: ActiveFilterSchema,
  name: z.string().trim().optional(),
});

export const CreateBrandSchema = z.object({
  name: z.string().trim().min(1, "ຕ້ອງໃສ່ຊື່ຍີ່ຫໍ້"),
  slug: slugSchema.optional(),
  isActive: z.boolean().optional().default(true),
});

export const UpdateBrandSchema = z.object({
  name: z.string().trim().min(1).optional(),
  slug: slugSchema.optional(),
  isActive: z.boolean().optional(),
});

export type BrandDTO = z.infer<typeof BrandSchema>;
export type BrandsListQueryDTO = z.infer<typeof BrandsListQuerySchema>;
export type CreateBrandDTO = z.infer<typeof CreateBrandSchema>;
export type UpdateBrandDTO = z.infer<typeof UpdateBrandSchema>;
