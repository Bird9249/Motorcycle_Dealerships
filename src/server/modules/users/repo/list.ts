import { schema } from "@/server/platform/db/client";
import { role, userRole } from "@/server/platform/db/schema/rbac";
import type { OffsetPageQueryDTO } from "@/server/shared/contracts/base";
import { buildOrderBy, buildWhereGroups } from "@/server/shared/db/query";
import type { DbTransaction } from "@/server/shared/types";
import { eq, sql } from "drizzle-orm";

const columns = {
  id: schema.user.id,
  email: schema.user.email,
  name: schema.user.name,
  image: schema.user.image,
  banned: schema.user.banned,
  role: schema.user.role,
  roleId: userRole.roleId,
  roleName: role.name,
  createdAt: schema.user.createdAt,
  updatedAt: schema.user.updatedAt,
} as const;

export async function listUsers(
  query: OffsetPageQueryDTO,
  client: DbTransaction,
) {
  const orderBy = buildOrderBy(columns, query.sort);
  const whereExpr = buildWhereGroups(columns, query.filters ?? []);

  const countRow = await client
    .select({
      count: sql<number>`cast(count(distinct ${schema.user.id}) as int)`,
    })
    .from(schema.user)
    .leftJoin(userRole, eq(userRole.userId, schema.user.id))
    .leftJoin(role, eq(role.id, userRole.roleId))
    .where(whereExpr);
  const total = countRow[0]?.count ?? 0;

  // Select with joins and aggregate roles per user
  const selectClause = {
    id: schema.user.id,
    email: schema.user.email,
    name: schema.user.name,
    image: schema.user.image,
    banned: schema.user.banned,
    createdAt: schema.user.createdAt,
    updatedAt: schema.user.updatedAt,
    roleIds: sql<
      string[]
    >`coalesce(array_agg(distinct ${userRole.roleId}) filter (where ${userRole.roleId} is not null), '{}'::text[])`,
    roles: sql<unknown>`coalesce(jsonb_agg(distinct jsonb_build_object('id', ${role.id}, 'name', ${role.name})) filter (where ${role.id} is not null), '[]'::jsonb)`,
  } as const;

  const base = client
    .select(selectClause)
    .from(schema.user)
    .leftJoin(userRole, eq(userRole.userId, schema.user.id))
    .leftJoin(role, eq(role.id, userRole.roleId));

  const filtered = whereExpr ? base.where(whereExpr) : base;
  const grouped = filtered.groupBy(
    schema.user.id,
    schema.user.email,
    schema.user.name,
    schema.user.image,
    schema.user.banned,
    schema.user.createdAt,
    schema.user.updatedAt,
  );
  const ordered =
    orderBy && orderBy.length > 0 ? grouped.orderBy(...orderBy) : grouped;
  const rows = await ordered.limit(query.limit).offset(query.offset);

  return {
    data: rows.map((r) => {
      const rolesRaw = r.roles;
      const rolesArr: Array<{ id: string; name: string }> = Array.isArray(
        rolesRaw,
      )
        ? (rolesRaw as Array<{ id: string; name: string }>)
        : [];
      return {
        id: r.id,
        email: r.email,
        name: r.name ?? null,
        image: r.image ?? null,
        banned: (r as unknown as { banned?: boolean }).banned ?? false,
        roleIds: r.roleIds ?? [],
        roles: rolesArr,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    }),
    meta: { total, limit: query.limit, offset: query.offset },
  };
}
