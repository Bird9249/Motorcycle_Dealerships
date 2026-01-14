import { mediaAssets } from "@/server/platform/db/schema";
import { formatNow } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import { eq } from "drizzle-orm";

export async function unarchiveMedia(
  id: string,
  client: DbTransaction,
): Promise<boolean> {
  const now = formatNow();
  const rows = await client
    .update(mediaAssets)
    .set({ archived: false, updatedAt: now })
    .where(eq(mediaAssets.id, id))
    .returning({ id: mediaAssets.id });
  return rows.length > 0;
}
