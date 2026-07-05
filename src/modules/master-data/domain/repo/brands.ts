import { and, eq, ilike, sql } from "drizzle-orm";
import type { BrandsListQueryDTO } from "../contracts/brands";
import { activeFilterToBoolean } from "../contracts/common";
import { brands, models } from "@/server/platform/db/schema/inventory";
import type { DbTransaction } from "@/shared/types";

const brandSelect = {
  id: brands.id,
  name: brands.name,
  slug: brands.slug,
  isActive: brands.isActive,
  modelCount: sql<number>`cast((
    select count(*) from ${models}
    where ${models.brandId} = ${brands.id}
  ) as int)`.as("modelCount"),
  createdAt: brands.createdAt,
  updatedAt: brands.updatedAt,
} as const;

export async function listBrands(query: BrandsListQueryDTO, client: DbTransaction) {
  const conditions = [];
  const isActive = activeFilterToBoolean(query.active);
  if (isActive !== undefined) conditions.push(eq(brands.isActive, isActive));
  if (query.name?.trim()) {
    conditions.push(ilike(brands.name, `%${query.name.trim()}%`));
  }

  const whereExpr = conditions.length > 0 ? and(...conditions) : undefined;

  let base = client.select(brandSelect).from(brands);
  if (whereExpr) base = base.where(whereExpr) as typeof base;

  return base.orderBy(brands.name);
}

export async function getBrandById(id: string, client: DbTransaction) {
  const rows = await client
    .select(brandSelect)
    .from(brands)
    .where(eq(brands.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function findBrandBySlug(
  slug: string,
  client: DbTransaction,
  excludeId?: string,
) {
  const rows = await client
    .select({ id: brands.id })
    .from(brands)
    .where(eq(brands.slug, slug))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (excludeId && row.id === excludeId) return null;
  return row;
}

export async function insertBrand(
  values: typeof brands.$inferInsert,
  client: DbTransaction,
) {
  const [created] = await client
    .insert(brands)
    .values(values)
    .returning({ id: brands.id });
  if (!created) return null;
  return getBrandById(created.id, client);
}

export async function updateBrandById(
  id: string,
  values: Partial<typeof brands.$inferInsert>,
  client: DbTransaction,
) {
  const [updated] = await client
    .update(brands)
    .set(values)
    .where(eq(brands.id, id))
    .returning({ id: brands.id });
  if (!updated) return null;
  return getBrandById(updated.id, client);
}
