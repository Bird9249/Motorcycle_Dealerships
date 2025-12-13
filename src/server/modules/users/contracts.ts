import { z } from "zod";
import { zfd } from "zod-form-data";

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  image: z.string().nullable().optional(),
  banned: z.boolean().optional().default(false),
  roleIds: z.array(z.string()).optional().default([]),
  roles: z
    .array(z.object({ id: z.string(), name: z.string() }))
    .optional()
    .default([]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type UserDTO = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  image: z.string().nullable().optional(),
  password: z.string().min(1).optional(),
  roleId: z.string().min(1).optional(),
});
export type CreateUserDTO = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  image: z.string().nullable().optional(),
  password: z.string().min(1).optional(),
  roleId: z.string().min(1).optional(),
});
export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;

export const IdParamSchema = z.object({ id: z.string().min(1) });
export type IdParamDTO = z.infer<typeof IdParamSchema>;

export const BanUserSchema = z.object({
  reason: z.string().max(255).optional(),
  expires: z
    .string()
    .datetime()
    .transform((s) => new Date(s))
    .optional(),
});
export type BanUserDTO = z.infer<typeof BanUserSchema>;

// FormData specific schemas (for use with zValidator("form", ...))
export const CreateUserFormSchema = zfd.formData({
  email: zfd.text(z.string().email()),
  name: zfd.text(z.string().min(1)),
  imageFile: zfd.file(z.instanceof(File).optional()),
  password: zfd.text(z.string().min(1)).optional(),
  roleId: zfd.text(z.string().min(1)).optional(),
});
export type CreateUserFormDTO = z.infer<typeof CreateUserFormSchema>;

export const UpdateUserFormSchema = zfd.formData({
  email: zfd.text(z.string().email().optional()),
  name: zfd.text(z.string().min(1).optional()),
  image: zfd.text(z.string().optional()),
  imageFile: zfd.file(z.instanceof(File).optional().nullable()),
  imageDelete: zfd.text(z.string().optional()),
  roleId: zfd.text(z.string().min(1).optional()),
  password: zfd.text(z.string().optional()),
});
export type UpdateUserFormDTO = z.infer<typeof UpdateUserFormSchema>;
