import { mediaAssets } from "@/server/platform/db/schema";
import type { DbTransaction } from "@/shared/types";

type MediaRow = typeof mediaAssets.$inferSelect;

export async function createMedia(
  input: typeof mediaAssets.$inferInsert,
  client: DbTransaction,
) {
  const [mediaRow] = (await client
    .insert(mediaAssets)
    .values(input)
    .returning()) as unknown as MediaRow[];
  return mediaRow;
}
