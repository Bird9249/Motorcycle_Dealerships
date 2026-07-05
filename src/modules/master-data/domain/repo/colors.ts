import { and, eq, ilike } from "drizzle-orm";
import type { ColorsListQueryDTO } from "../contracts/colors";
import { activeFilterToBoolean } from "../contracts/common";
import { colors } from "@/server/platform/db/schema/inventory";
import type { DbTransaction } from "@/shared/types";

const colorSelect = {
  id: colors.id,
  name: colors.name,
  hexCode: colors.hexCode,
  isActive: colors.isActive,
  createdAt: colors.createdAt,
  updatedAt: colors.updatedAt,
} as const;

export async function listColors(query: ColorsListQueryDTO, client: DbTransaction) {
  const conditions = [];
  const isActive = activeFilterToBoolean(query.active);
  if (isActive !== undefined) conditions.push(eq(colors.isActive, isActive));
  if (query.name?.trim()) {
    conditions.push(ilike(colors.name, `%${query.name.trim()}%`));
  }

  const whereExpr = conditions.length > 0 ? and(...conditions) : undefined;

  let base = client.select(colorSelect).from(colors);
  if (whereExpr) base = base.where(whereExpr) as typeof base;

  return base.orderBy(colors.name);
}

export async function getColorById(id: string, client: DbTransaction) {
  const rows = await client
    .select(colorSelect)
    .from(colors)
    .where(eq(colors.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function findColorByName(
  name: string,
  client: DbTransaction,
  excludeId?: string,
) {
  const rows = await client
    .select({ id: colors.id })
    .from(colors)
    .where(eq(colors.name, name))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (excludeId && row.id === excludeId) return null;
  return row;
}

export async function insertColor(
  values: typeof colors.$inferInsert,
  client: DbTransaction,
) {
  const [created] = await client.insert(colors).values(values).returning(colorSelect);
  return created ?? null;
}

export async function updateColorById(
  id: string,
  values: Partial<typeof colors.$inferInsert>,
  client: DbTransaction,
) {
  const [updated] = await client
    .update(colors)
    .set(values)
    .where(eq(colors.id, id))
    .returning(colorSelect);
  return updated ?? null;
}
