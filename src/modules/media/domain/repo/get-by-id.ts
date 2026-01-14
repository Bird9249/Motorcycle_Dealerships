import { and, eq } from "drizzle-orm";
import type { PermissionId } from "@/modules/roles/domain/contracts/permissions";
import { mediaAssets } from "@/server/platform/db/schema";
import type { DbTransaction } from "@/shared/types";

type MediaRow = typeof mediaAssets.$inferSelect;

export async function getMediaById(
  id: string,
  client: DbTransaction,
  userId?: string,
  permissions?: PermissionId[],
) {
  // Permission-based filtering
  // ถ้ามี permission media:all → สามารถดูไฟล์ทั้งหมดได้
  // ถ้าไม่มี → สามารถดูได้เฉพาะไฟล์ที่ตัวเองอัพโหลด
  const hasMediaAllPermission = permissions?.includes("media:all") ?? false;

  const whereExpr = hasMediaAllPermission
    ? eq(mediaAssets.id, id) // สามารถดูได้ทั้งหมด
    : userId
      ? and(eq(mediaAssets.id, id), eq(mediaAssets.createdBy, userId)) // สามารถดูได้เฉพาะไฟล์ที่ตัวเองอัพโหลด
      : undefined; // ถ้าไม่มี userId และไม่มี permission → ไม่เห็นอะไรเลย

  if (!whereExpr) return null;

  const [r] = (await client
    .select()
    .from(mediaAssets)
    .where(whereExpr)) as unknown as MediaRow[];
  return r
    ? {
        id: r.id,
        fileUrl: r.fileUrl,
        altText: r.altText ?? null,
        mimeType: r.mimeType ?? null,
        fileName: r.fileName ?? null,
        fileSize: r.fileSize ?? null,
        width: r.width ?? null,
        height: r.height ?? null,
        createdBy: r.createdBy ?? null,
        archived: r.archived ?? false,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }
    : null;
}
