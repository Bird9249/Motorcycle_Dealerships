import { eq } from "drizzle-orm";
import { mediaAssets } from "@/server/platform/db/schema";
import type { DbTransaction } from "@/shared/types";

export async function removeMedia(
  id: string,
  client: DbTransaction,
): Promise<boolean> {
  const rows = await client
    .delete(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .returning({ id: mediaAssets.id });
  return rows.length > 0;
}
