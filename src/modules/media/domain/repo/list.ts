import { and, eq, sql } from "drizzle-orm";
import type { PermissionId } from "@/modules/roles/domain/contracts/permissions";
import { mediaAssets, user } from "@/server/platform/db/schema";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { buildOrderBy, buildWhereGroups } from "@/shared/db/query";
import type { DbTransaction } from "@/shared/types";

const columns = {
  id: mediaAssets.id,
  fileUrl: mediaAssets.fileUrl,
  altText: mediaAssets.altText,
  mimeType: mediaAssets.mimeType,
  fileName: mediaAssets.fileName,
  fileSize: mediaAssets.fileSize,
  width: mediaAssets.width,
  height: mediaAssets.height,
  createdBy: mediaAssets.createdBy,
  archived: mediaAssets.archived,
  createdAt: mediaAssets.createdAt,
  updatedAt: mediaAssets.updatedAt,
  createdByName: user.name,
  createdByEmail: user.email,
} as const;

export async function listMedia(
  query: OffsetPageQueryDTO,
  client: DbTransaction,
  userId?: string,
  permissions?: PermissionId[],
) {
  const orderBy = buildOrderBy(columns, query.sort);
  const filterExpr = buildWhereGroups(columns, query.filters ?? []);

  // Permission-based filtering
  // ถ้ามี permission media:all หรือเป็น admin → สามารถดูไฟล์ทั้งหมดได้
  // ถ้าไม่มี → สามารถดูได้เฉพาะไฟล์ที่ตัวเองอัพโหลด
  const hasMediaAllPermission = permissions?.includes("media:all") ?? false;

  const permissionExpr = hasMediaAllPermission
    ? undefined // สามารถดูได้ทั้งหมด
    : userId
      ? eq(mediaAssets.createdBy, userId) // สามารถดูได้เฉพาะไฟล์ที่ตัวเองอัพโหลด
      : sql`FALSE`; // ถ้าไม่มี userId และไม่มี permission → ไม่เห็นอะไรเลย

  // รวม filter จาก query กับ permission filter
  const whereExpr =
    filterExpr && permissionExpr
      ? and(filterExpr, permissionExpr)
      : (filterExpr ?? permissionExpr);

  const countRow = await client
    .select({
      count: sql<number>`cast(count(distinct ${mediaAssets.id}) as int)`,
    })
    .from(mediaAssets)
    .leftJoin(user, eq(user.id, mediaAssets.createdBy))
    .where(whereExpr);
  const total = countRow[0]?.count ?? 0;

  const selectClause = {
    id: mediaAssets.id,
    fileUrl: mediaAssets.fileUrl,
    altText: mediaAssets.altText,
    mimeType: mediaAssets.mimeType,
    fileName: mediaAssets.fileName,
    fileSize: mediaAssets.fileSize,
    width: mediaAssets.width,
    height: mediaAssets.height,
    createdBy: mediaAssets.createdBy,
    archived: mediaAssets.archived,
    createdAt: mediaAssets.createdAt,
    updatedAt: mediaAssets.updatedAt,
    createdByName: user.name,
    createdByEmail: user.email,
  } as const;

  const base = client
    .select(selectClause)
    .from(mediaAssets)
    .leftJoin(user, eq(user.id, mediaAssets.createdBy));

  const filtered = whereExpr ? base.where(whereExpr) : base;
  const grouped = filtered.groupBy(
    mediaAssets.id,
    mediaAssets.fileUrl,
    mediaAssets.altText,
    mediaAssets.mimeType,
    mediaAssets.fileName,
    mediaAssets.fileSize,
    mediaAssets.width,
    mediaAssets.height,
    mediaAssets.createdBy,
    mediaAssets.archived,
    mediaAssets.createdAt,
    mediaAssets.updatedAt,
    user.name,
    user.email,
  );
  const ordered =
    orderBy && orderBy.length > 0 ? grouped.orderBy(...orderBy) : grouped;
  const rows = await ordered.limit(query.limit).offset(query.offset);

  return {
    data: rows.map((r) => ({
      id: r.id,
      fileUrl: r.fileUrl,
      altText: r.altText ?? null,
      mimeType: r.mimeType ?? null,
      fileName: r.fileName ?? null,
      fileSize: r.fileSize ?? null,
      width: r.width ?? null,
      height: r.height ?? null,
      createdBy: r.createdBy ?? null,
      createdByName: r.createdByName ?? null,
      createdByEmail: r.createdByEmail ?? null,
      archived: r.archived ?? false,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    meta: { total, limit: query.limit, offset: query.offset },
  };
}
