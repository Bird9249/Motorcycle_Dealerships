import { and, eq, ilike, sql } from "drizzle-orm";
import { activeFilterToBoolean } from "../contracts/common";
import type { ModelsListQueryDTO } from "../contracts/models";
import { brands, models, vehicles } from "@/server/platform/db/schema/inventory";
import type { DbTransaction } from "@/shared/types";

const modelSelect = {
  id: models.id,
  brandId: models.brandId,
  name: models.name,
  vehicleType: models.vehicleType,
  engineCc: models.engineCc,
  batteryCapacityKwh: models.batteryCapacityKwh,
  year: models.year,
  isActive: models.isActive,
  vehicleCount: sql<number>`cast((
    select count(*) from ${vehicles}
    where ${vehicles.modelId} = ${models.id}
  ) as int)`.as("vehicleCount"),
  createdAt: models.createdAt,
  updatedAt: models.updatedAt,
  brand: {
    id: brands.id,
    name: brands.name,
    slug: brands.slug,
    isActive: brands.isActive,
  },
} as const;

export async function listModels(query: ModelsListQueryDTO, client: DbTransaction) {
  const conditions = [];
  const isActive = activeFilterToBoolean(query.active);
  if (isActive !== undefined) conditions.push(eq(models.isActive, isActive));
  if (query.brandId) conditions.push(eq(models.brandId, query.brandId));
  if (query.vehicleType) conditions.push(eq(models.vehicleType, query.vehicleType));
  if (query.name?.trim()) {
    conditions.push(ilike(models.name, `%${query.name.trim()}%`));
  }

  const whereExpr = conditions.length > 0 ? and(...conditions) : undefined;

  let base = client
    .select(modelSelect)
    .from(models)
    .innerJoin(brands, eq(brands.id, models.brandId));

  if (whereExpr) base = base.where(whereExpr) as typeof base;

  return base.orderBy(brands.name, models.name);
}

export async function getModelById(id: string, client: DbTransaction) {
  const rows = await client
    .select(modelSelect)
    .from(models)
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(eq(models.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function findModelByBrandAndName(
  client: DbTransaction,
  params: { brandId: string; name: string; excludeId?: string },
) {
  const rows = await client
    .select({ id: models.id })
    .from(models)
    .where(and(eq(models.brandId, params.brandId), eq(models.name, params.name)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (params.excludeId && row.id === params.excludeId) return null;
  return row;
}

export async function insertModel(
  values: typeof models.$inferInsert,
  client: DbTransaction,
) {
  const [created] = await client.insert(models).values(values).returning({
    id: models.id,
  });
  if (!created) return null;
  return getModelById(created.id, client);
}

export async function updateModelById(
  id: string,
  values: Partial<typeof models.$inferInsert>,
  client: DbTransaction,
) {
  const [updated] = await client
    .update(models)
    .set(values)
    .where(eq(models.id, id))
    .returning({ id: models.id });
  if (!updated) return null;
  return getModelById(updated.id, client);
}
