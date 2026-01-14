import { mediaAssets } from "@/server/platform/db/schema";
import { formatNow } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import { eq } from "drizzle-orm";
import type { UpdateMediaDTO } from "../contracts";

type MediaRow = typeof mediaAssets.$inferSelect;

export async function updateMedia(
  id: string,
  input: UpdateMediaDTO & {
    fileUrl?: string;
    fileName?: string | null;
    fileSize?: number | null;
  },
  client: DbTransaction,
) {
  const now = formatNow();
  const values: Partial<MediaRow> & { updatedAt: string } = {
    updatedAt: now,
    ...(input.altText !== undefined ? { altText: input.altText } : {}),
    ...(input.fileUrl !== undefined ? { fileUrl: input.fileUrl } : {}),
    ...(input.fileName !== undefined ? { fileName: input.fileName } : {}),
    ...(input.fileSize !== undefined ? { fileSize: input.fileSize } : {}),
  };
  const [updated] = await client
    .update(mediaAssets)
    .set(values)
    .where(eq(mediaAssets.id, id))
    .returning();
  if (!updated) return null;

  return {
    id: updated.id,
    fileUrl: updated.fileUrl,
    altText: updated.altText ?? null,
    mimeType: updated.mimeType ?? null,
    fileName: updated.fileName ?? null,
    fileSize: updated.fileSize ?? null,
    width: updated.width ?? null,
    height: updated.height ?? null,
    createdBy: updated.createdBy ?? null,
    archived: updated.archived ?? false,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}
