import { and, eq, ilike, or, sql } from "drizzle-orm";
import type { PermissionId } from "@/modules/roles/domain/contracts/permissions";
import { mediaAssets } from "@/server/platform/db/schema";
import type { DbTransaction } from "@/shared/types";
import type { MediaLookupQueryDTO } from "../contracts";

export async function lookupMedia(
  query: MediaLookupQueryDTO,
  client: DbTransaction,
  userId?: string,
  permissions?: PermissionId[],
) {
  const { q, limit, skip } = query;
  const archivedFilter = eq(mediaAssets.archived, false);
  const searchFilter = q
    ? or(
        ilike(mediaAssets.fileName, `%${q}%`),
        ilike(mediaAssets.altText, `%${q}%`),
      )
    : undefined;

  // Permission-based filtering
  const hasMediaAllPermission = permissions?.includes("media:all") ?? false;
  const permissionFilter = hasMediaAllPermission
    ? undefined // สามารถดูได้ทั้งหมด
    : userId
      ? eq(mediaAssets.createdBy, userId) // สามารถดูได้เฉพาะไฟล์ที่ตัวเองอัพโหลด
      : sql`FALSE`; // ถ้าไม่มี userId และไม่มี permission → ไม่เห็นอะไรเลย

  const whereExpr = and(
    archivedFilter,
    ...(searchFilter ? [searchFilter] : []),
    ...(permissionFilter ? [permissionFilter] : []),
  );

  const rows = await client
    .select({
      id: mediaAssets.id,
      fileName: mediaAssets.fileName,
      fileUrl: mediaAssets.fileUrl,
    })
    .from(mediaAssets)
    .where(whereExpr)
    .limit(limit)
    .offset(skip);

  const [countRow] = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(mediaAssets)
    .where(whereExpr);
  const total = countRow?.count ?? 0;

  return {
    items: rows.map((r) => ({
      id: r.id,
      name: r.fileName ?? r.fileUrl,
      fileUrl: r.fileUrl,
    })),
    total: total ?? 0,
  };
}
