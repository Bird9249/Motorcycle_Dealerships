import { auth } from "@/modules/auth/domain/better-auth";
import { z } from "zod";

// Entities (domain shapes shared across apps)
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  passwordHash: z.string(),
});
export type UserDTO = z.infer<typeof UserSchema>;

export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  expiresAt: z.coerce.date(),
});
export type SessionDTO = z.infer<typeof SessionSchema>;

// DTOs for requests
export const SignInInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type SignInInputDTO = z.infer<typeof SignInInputSchema>;

export const SignUpInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});
export type SignUpInputDTO = z.infer<typeof SignUpInputSchema>;

export const AuthTokenSchema = z.object({ token: z.string() });
export type AuthTokenDTO = z.infer<typeof AuthTokenSchema>;

export { auth };
