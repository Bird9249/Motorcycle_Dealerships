import type { auth } from "@/server/shared/contracts/auth";
import { config } from "@/web/shared/lib/config";
import { fetcher } from "@/web/shared/lib/fetcher";
import {
  adminClient,
  customSessionClient,
  phoneNumberClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: config.authUrl,
  plugins: [
    phoneNumberClient(),
    adminClient(),
    customSessionClient<typeof auth>(),
  ],
});

export const profileApi = {
  async get() {
    return fetcher.get<{
      user: { id: string; name: string; email: string; image?: string | null };
    }>(`${config.apiUrl}/me`);
  },
  async update(form: FormData) {
    return fetcher.putForm<{ user: { id: string } }>(
      `${config.apiUrl}/me`,
      form,
    );
  },
};
