import { and, eq } from "drizzle-orm";
import type { ModelsListQueryDTO } from "@/modules/inventory/domain/contracts";
import { brands, models } from "@/server/platform/db/schema/inventory";
import type { DbTransaction } from "@/shared/types";

export async function listModels(
  query: ModelsListQueryDTO,
  client: DbTransaction,
) {
  const conditions = [eq(models.isActive, true), eq(brands.isActive, true)];
  if (query.brandId) conditions.push(eq(models.brandId, query.brandId));

  return client
    .select({
      id: models.id,
      brandId: models.brandId,
      name: models.name,
      vehicleType: models.vehicleType,
      engineCc: models.engineCc,
      batteryCapacityKwh: models.batteryCapacityKwh,
      year: models.year,
      isActive: models.isActive,
      brand: {
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
        isActive: brands.isActive,
      },
    })
    .from(models)
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(and(...conditions))
    .orderBy(brands.name, models.name);
}

export async function getModelById(id: string, client: DbTransaction) {
  const rows = await client
    .select({
      id: models.id,
      brandId: models.brandId,
      name: models.name,
      vehicleType: models.vehicleType,
      engineCc: models.engineCc,
      batteryCapacityKwh: models.batteryCapacityKwh,
      year: models.year,
      isActive: models.isActive,
    })
    .from(models)
    .where(eq(models.id, id))
    .limit(1);

  return rows[0] ?? null;
}
