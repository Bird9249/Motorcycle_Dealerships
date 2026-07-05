import { and, eq, sql } from "drizzle-orm";
import type { VehiclesListQueryDTO } from "@/modules/inventory/domain/contracts";
import {
  brands,
  colors,
  models,
  vehicleDocuments,
  vehicles,
} from "@/server/platform/db/schema/inventory";
import { buildOrderBy, buildWhereGroups } from "@/shared/db/query";
import type { DbTransaction } from "@/shared/types";

const columns = {
  id: vehicles.id,
  modelId: vehicles.modelId,
  colorId: vehicles.colorId,
  chassisNumber: vehicles.chassisNumber,
  engineNumber: vehicles.engineNumber,
  batterySerialNumber: vehicles.batterySerialNumber,
  status: vehicles.status,
  costPrice: vehicles.costPrice,
  listPrice: vehicles.listPrice,
  importInvoiceReceived: vehicles.importInvoiceReceived,
  technicalInspectionReceived: vehicles.technicalInspectionReceived,
  registrationReady: vehicles.registrationReady,
  createdAt: vehicles.createdAt,
  updatedAt: vehicles.updatedAt,
  brandId: models.brandId,
  vehicleType: models.vehicleType,
} as const;

function mapVehicleRow(row: {
  id: string;
  modelId: string;
  colorId: string;
  chassisNumber: string | null;
  engineNumber: string | null;
  batterySerialNumber: string | null;
  batteryCapacityKwh: string | null;
  status: "in_stock" | "reserved" | "sold" | "in_service" | "written_off";
  costPrice: string;
  costCurrency: "LAK" | "THB" | "USD";
  listPrice: string;
  listCurrency: "LAK" | "THB" | "USD";
  importInvoiceReceived: boolean;
  technicalInspectionReceived: boolean;
  registrationReady: boolean;
  importDate: string | null;
  notes: string | null;
  soldAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  modelName: string;
  vehicleType: "ice" | "ev";
  engineCc: number | null;
  modelBatteryCapacityKwh: string | null;
  modelYear: number | null;
  brandId: string;
  brandName: string;
  brandSlug: string;
  colorName: string;
  colorHexCode: string | null;
}) {
  return {
    id: row.id,
    modelId: row.modelId,
    colorId: row.colorId,
    chassisNumber: row.chassisNumber,
    engineNumber: row.engineNumber,
    batterySerialNumber: row.batterySerialNumber,
    batteryCapacityKwh: row.batteryCapacityKwh,
    status: row.status,
    costPrice: row.costPrice,
    costCurrency: row.costCurrency,
    listPrice: row.listPrice,
    listCurrency: row.listCurrency,
    importInvoiceReceived: row.importInvoiceReceived,
    technicalInspectionReceived: row.technicalInspectionReceived,
    registrationReady: row.registrationReady,
    importDate: row.importDate,
    notes: row.notes,
    soldAt: row.soldAt,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    model: {
      id: row.modelId,
      name: row.modelName,
      vehicleType: row.vehicleType,
      engineCc: row.engineCc,
      batteryCapacityKwh: row.modelBatteryCapacityKwh,
      year: row.modelYear,
    },
    brand: {
      id: row.brandId,
      name: row.brandName,
      slug: row.brandSlug,
    },
    color: {
      id: row.colorId,
      name: row.colorName,
      hexCode: row.colorHexCode,
    },
  };
}

const vehicleSelect = {
  id: vehicles.id,
  modelId: vehicles.modelId,
  colorId: vehicles.colorId,
  chassisNumber: vehicles.chassisNumber,
  engineNumber: vehicles.engineNumber,
  batterySerialNumber: vehicles.batterySerialNumber,
  batteryCapacityKwh: vehicles.batteryCapacityKwh,
  status: vehicles.status,
  costPrice: vehicles.costPrice,
  costCurrency: vehicles.costCurrency,
  listPrice: vehicles.listPrice,
  listCurrency: vehicles.listCurrency,
  importInvoiceReceived: vehicles.importInvoiceReceived,
  technicalInspectionReceived: vehicles.technicalInspectionReceived,
  registrationReady: vehicles.registrationReady,
  importDate: vehicles.importDate,
  notes: vehicles.notes,
  soldAt: vehicles.soldAt,
  createdBy: vehicles.createdBy,
  createdAt: vehicles.createdAt,
  updatedAt: vehicles.updatedAt,
  modelName: models.name,
  vehicleType: models.vehicleType,
  engineCc: models.engineCc,
  modelBatteryCapacityKwh: models.batteryCapacityKwh,
  modelYear: models.year,
  brandId: brands.id,
  brandName: brands.name,
  brandSlug: brands.slug,
  colorName: colors.name,
  colorHexCode: colors.hexCode,
} as const;

export async function listVehicles(
  query: VehiclesListQueryDTO,
  client: DbTransaction,
) {
  const extraFilters = [];
  if (query.status) extraFilters.push(eq(vehicles.status, query.status));
  if (query.modelId) extraFilters.push(eq(vehicles.modelId, query.modelId));
  if (query.brandId) extraFilters.push(eq(models.brandId, query.brandId));
  if (query.vehicleType)
    extraFilters.push(eq(models.vehicleType, query.vehicleType));
  if (query.registrationReady === "ready")
    extraFilters.push(eq(vehicles.registrationReady, true));
  if (query.registrationReady === "not_ready")
    extraFilters.push(eq(vehicles.registrationReady, false));

  const whereExpr = buildWhereGroups(columns, query.filters ?? []);
  const combinedWhere =
    extraFilters.length > 0 || whereExpr
      ? and(whereExpr ?? sql`true`, ...extraFilters)
      : undefined;

  const orderBy = buildOrderBy(columns, query.sort);

  const countRow = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(vehicles)
    .innerJoin(models, eq(models.id, vehicles.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(combinedWhere);
  const total = countRow[0]?.count ?? 0;

  let base = client
    .select(vehicleSelect)
    .from(vehicles)
    .innerJoin(models, eq(models.id, vehicles.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .innerJoin(colors, eq(colors.id, vehicles.colorId));

  if (combinedWhere) base = base.where(combinedWhere) as typeof base;
  if (orderBy && orderBy.length > 0)
    base = base.orderBy(...orderBy) as typeof base;

  const rows = await base.limit(query.limit).offset(query.offset);

  return {
    data: rows.map(mapVehicleRow),
    meta: { total, limit: query.limit, offset: query.offset },
  };
}

export async function getVehicleById(id: string, client: DbTransaction) {
  const rows = await client
    .select(vehicleSelect)
    .from(vehicles)
    .innerJoin(models, eq(models.id, vehicles.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .innerJoin(colors, eq(colors.id, vehicles.colorId))
    .where(eq(vehicles.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const docs = await client
    .select({
      id: vehicleDocuments.id,
      documentType: vehicleDocuments.documentType,
      fileKey: vehicleDocuments.fileKey,
      fileName: vehicleDocuments.fileName,
      uploadedAt: vehicleDocuments.uploadedAt,
      uploadedBy: vehicleDocuments.uploadedBy,
    })
    .from(vehicleDocuments)
    .where(eq(vehicleDocuments.vehicleId, id))
    .orderBy(vehicleDocuments.uploadedAt);

  return {
    ...mapVehicleRow(row),
    documents: docs,
  };
}

export async function createVehicle(
  values: typeof vehicles.$inferInsert,
  client: DbTransaction,
) {
  const [created] = await client.insert(vehicles).values(values).returning({
    id: vehicles.id,
  });
  if (!created) return null;
  return getVehicleById(created.id, client);
}

export async function updateVehicleById(
  id: string,
  values: Partial<typeof vehicles.$inferInsert>,
  client: DbTransaction,
) {
  const [updated] = await client
    .update(vehicles)
    .set(values)
    .where(eq(vehicles.id, id))
    .returning({ id: vehicles.id });

  if (!updated) return null;
  return getVehicleById(updated.id, client);
}

export async function deleteVehicleById(id: string, client: DbTransaction) {
  const [deleted] = await client
    .delete(vehicles)
    .where(eq(vehicles.id, id))
    .returning({ id: vehicles.id });
  return deleted ?? null;
}

export async function findVehicleIdentifierConflicts(
  client: DbTransaction,
  input: {
    chassisNumber?: string | null;
    engineNumber?: string | null;
    batterySerialNumber?: string | null;
    excludeId?: string;
  },
) {
  const conflicts: Array<
    "chassisNumber" | "engineNumber" | "batterySerialNumber"
  > = [];

  const checks = [
    {
      field: "chassisNumber" as const,
      column: vehicles.chassisNumber,
      value: input.chassisNumber,
    },
    {
      field: "engineNumber" as const,
      column: vehicles.engineNumber,
      value: input.engineNumber,
    },
    {
      field: "batterySerialNumber" as const,
      column: vehicles.batterySerialNumber,
      value: input.batterySerialNumber,
    },
  ];

  for (const check of checks) {
    if (!check.value) continue;

    const conditions = [eq(check.column, check.value)];
    if (input.excludeId) {
      conditions.push(sql`${vehicles.id} <> ${input.excludeId}`);
    }

    const rows = await client
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(and(...conditions))
      .limit(1);

    if (rows.length > 0) conflicts.push(check.field);
  }

  return conflicts;
}
