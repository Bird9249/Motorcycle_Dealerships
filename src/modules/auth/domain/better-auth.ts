import { getEffectivePermissionsService } from "@/modules/roles/domain/service/user-permissions";
import { db } from "@/server/platform/db/client";
import * as schema from "@/server/platform/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  admin,
  customSession,
  openAPI,
  phoneNumber,
} from "better-auth/plugins";
import { bcryptLikeHasher } from "./services";

const baseURL =
  process.env.BETTER_AUTH_BASE_URL ||
  process.env.CORS_ORIGIN ||
  "http://localhost:3000";

export const auth = betterAuth({
  basePath: "/api/auth",
  baseURL,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  trustedOrigins: [process.env.CORS_ORIGIN || ""],
  emailAndPassword: {
    enabled: true,
    password: {
      hash: bcryptLikeHasher.hash,
      async verify({ password, hash }) {
        return await bcryptLikeHasher.verify(password, hash);
      },
    },
  },
  advanced: {
    defaultCookieAttributes: { sameSite: "none", secure: true, httpOnly: true },
    cookiePrefix: "admin-",
  },
  plugins: [
    admin(),
    phoneNumber(),
    customSession(async ({ user, session }) => {
      const perms = await getEffectivePermissionsService(db, user.id);
      return {
        user,
        session,
        permissions: perms.map((p) => p.id),
      };
    }),
    openAPI(),
  ],
});
