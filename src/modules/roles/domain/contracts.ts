import { z } from "zod";
import { ALL_PERMISSIONS } from "./contracts/permissions";

const permissionIdSet = new Set<string>(ALL_PERMISSIONS.map((p) => p.id));

export const RoleIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9:_-]+$/i);

export const RoleCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional().default(null),
  permissions: z
    .array(z.string())
    .default([])
    .refine((arr) => arr.every((id) => permissionIdSet.has(id)), {
      message: "Invalid permission id in permissions",
    }),
});

export const RoleUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    permissions: z
      .array(z.string())
      .optional()
      .refine((arr) => !arr || arr.every((id) => permissionIdSet.has(id)), {
        message: "Invalid permission id in permissions",
      }),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "No fields to update",
  });

export const RoleIdParamSchema = z.object({ id: RoleIdSchema });

export type RoleCreateInput = z.infer<typeof RoleCreateSchema>;
export type RoleUpdateInput = z.infer<typeof RoleUpdateSchema>;

// Lookup/search (for infinite combobox)
export const RoleLookupQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
});
export type RoleLookupQueryDTO = z.infer<typeof RoleLookupQuerySchema>;
