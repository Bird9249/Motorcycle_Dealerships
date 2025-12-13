import type { DbClient } from "@/server/platform/db/client";
import { role } from "@/server/platform/db/schema/rbac";
import type {
  OffsetPageDTO,
  OffsetPageQueryDTO,
} from "@/server/shared/contracts/base";
import { buildOrderBy, buildWhere } from "@/server/shared/db/query";
import type { DbTransaction } from "@/server/shared/types";
import { count } from "drizzle-orm";

type RoleRow = typeof role.$inferSelect;

export async function listRoles(
  query: OffsetPageQueryDTO,
  client: DbTransaction | DbClient,
): Promise<OffsetPageDTO<RoleRow>> {
  const { limit, offset, sort, filters } = query;
  const columns = {
    id: role.id,
    name: role.name,
    description: role.description,
  } as const;

  const whereExpr = buildWhere(columns, filters ?? []);

  const orderClauses = buildOrderBy(columns, sort);

  const base = client.select().from(role);
  const filtered = whereExpr ? base.where(whereExpr) : base;
  const ordered =
    orderClauses && orderClauses.length > 0
      ? filtered.orderBy(...orderClauses)
      : filtered;
  const rows = (await ordered.limit(limit).offset(offset)) as RoleRow[];
  const countBase = client.select({ value: count() }).from(role);
  const countQ = whereExpr ? countBase.where(whereExpr) : countBase;
  const [{ value: total }] = (await countQ) as { value: number }[];
  return { data: rows, meta: { total, limit, offset } };
}
