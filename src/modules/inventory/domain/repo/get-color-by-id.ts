import { eq } from "drizzle-orm";
import { colors } from "@/server/platform/db/schema/inventory";
import type { DbTransaction } from "@/shared/types";

export async function getColorById(id: string, client: DbTransaction) {
  const rows = await client
    .select({
      id: colors.id,
      name: colors.name,
      isActive: colors.isActive,
    })
    .from(colors)
    .where(eq(colors.id, id))
    .limit(1);

  return rows[0] ?? null;
}
