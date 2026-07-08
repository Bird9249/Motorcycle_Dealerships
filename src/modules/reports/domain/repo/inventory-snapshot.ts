import { endOfDay } from "date-fns";
import { desc, eq, ne, sql } from "drizzle-orm";
import { brands, models, vehicles } from "@/server/platform/db/schema/inventory";
import type { DbTransaction } from "@/shared/types";
import type {
  InventoryReportDTO,
  InventoryReportQueryDTO,
} from "../contracts";

const activeVehicleFilter = ne(vehicles.status, "written_off");

export async function getInventoryReport(
  query: InventoryReportQueryDTO,
  client: DbTransaction,
): Promise<InventoryReportDTO> {
  const snapshotAt = query.dateTo
    ? endOfDay(new Date(query.dateTo))
    : new Date();
  const brandLimit = query.brandLimit ?? 10;

  const statusRows = await client
    .select({
      status: vehicles.status,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(vehicles)
    .where(activeVehicleFilter)
    .groupBy(vehicles.status);

  const typeRows = await client
    .select({
      vehicleType: models.vehicleType,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(vehicles)
    .innerJoin(models, eq(models.id, vehicles.modelId))
    .where(activeVehicleFilter)
    .groupBy(models.vehicleType);

  const brandRows = await client
    .select({
      brandId: brands.id,
      brandName: brands.name,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(vehicles)
    .innerJoin(models, eq(models.id, vehicles.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(activeVehicleFilter)
    .groupBy(brands.id, brands.name)
    .orderBy(desc(sql`count(*)`))
    .limit(brandLimit);

  const costRows = await client
    .select({
      currency: vehicles.costCurrency,
      totalAmount: sql<string>`coalesce(sum(${vehicles.costPrice}), 0)`,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(vehicles)
    .where(activeVehicleFilter)
    .groupBy(vehicles.costCurrency);

  const listRows = await client
    .select({
      currency: vehicles.listCurrency,
      totalAmount: sql<string>`coalesce(sum(${vehicles.listPrice}), 0)`,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(vehicles)
    .where(activeVehicleFilter)
    .groupBy(vehicles.listCurrency);

  const totalRow = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(vehicles)
    .where(activeVehicleFilter);

  return {
    snapshotAt: snapshotAt.toISOString(),
    totalVehicles: totalRow[0]?.count ?? 0,
    byStatus: statusRows.map((row) => ({
      status: row.status,
      count: row.count,
    })),
    byVehicleType: typeRows.map((row) => ({
      vehicleType: row.vehicleType,
      count: row.count,
    })),
    byBrand: brandRows.map((row) => ({
      brandId: row.brandId,
      brandName: row.brandName,
      count: row.count,
    })),
    costValueByCurrency: costRows.map((row) => ({
      currency: row.currency,
      totalAmount: row.totalAmount,
      count: row.count,
    })),
    listValueByCurrency: listRows.map((row) => ({
      currency: row.currency,
      totalAmount: row.totalAmount,
      count: row.count,
    })),
  };
}
