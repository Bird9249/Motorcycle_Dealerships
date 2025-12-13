import { password } from "bun";

export const bcryptLikeHasher = {
  async hash(raw: string): Promise<string> {
    return await password.hash(raw);
  },
  async verify(raw: string, stored: string): Promise<boolean> {
    return await password.verify(raw, stored);
  },
};
