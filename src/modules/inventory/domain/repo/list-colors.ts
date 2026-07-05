import { eq } from "drizzle-orm";
import { colors } from "@/server/platform/db/schema/inventory";
import type { DbTransaction } from "@/shared/types";

export async function listColors(client: DbTransaction) {
  return client
    .select({
      id: colors.id,
      name: colors.name,
      hexCode: colors.hexCode,
      isActive: colors.isActive,
    })
    .from(colors)
    .where(eq(colors.isActive, true))
    .orderBy(colors.name);
}
