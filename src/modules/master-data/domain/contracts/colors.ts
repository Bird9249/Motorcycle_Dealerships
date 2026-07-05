import { z } from "zod";
import { ActiveFilterSchema } from "./common";

const hexCodeSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Hex code must be #RRGGBB")
  .optional()
  .nullable();

export const ColorSchema = z.object({
  id: z.string(),
  name: z.string(),
  hexCode: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const ColorsListQuerySchema = z.object({
  active: ActiveFilterSchema,
  name: z.string().trim().optional(),
});

export const CreateColorSchema = z.object({
  name: z.string().trim().min(1, "ຕ້ອງໃສ່ຊື່ສີ"),
  hexCode: hexCodeSchema,
  isActive: z.boolean().optional().default(true),
});

export const UpdateColorSchema = z.object({
  name: z.string().trim().min(1).optional(),
  hexCode: hexCodeSchema,
  isActive: z.boolean().optional(),
});

export type ColorDTO = z.infer<typeof ColorSchema>;
export type ColorsListQueryDTO = z.infer<typeof ColorsListQuerySchema>;
export type CreateColorDTO = z.infer<typeof CreateColorSchema>;
export type UpdateColorDTO = z.infer<typeof UpdateColorSchema>;
