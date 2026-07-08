import { and, desc, eq, sql } from "drizzle-orm";
import { user } from "@/server/platform/db/schema/auth";
import { customers } from "@/server/platform/db/schema/customers";
import {
  brands,
  models,
  vehicles,
} from "@/server/platform/db/schema/inventory";
import { serviceRecords } from "@/server/platform/db/schema/after-sales";
import { salesOrders } from "@/server/platform/db/schema/sales";
import type { DbTransaction } from "@/shared/types";
import type {
  CreateServiceRecordDTO,
  ServiceRecordListItemDTO,
  ServiceRecordsListQueryDTO,
} from "../contracts";

const serviceSelect = {
  id: serviceRecords.id,
  vehicleId: serviceRecords.vehicleId,
  customerId: serviceRecords.customerId,
  serviceType: serviceRecords.serviceType,
  odometerKm: serviceRecords.odometerKm,
  description: serviceRecords.description,
  performedAt: serviceRecords.performedAt,
  performedBy: serviceRecords.performedBy,
  batteryHealthPercent: serviceRecords.batteryHealthPercent,
  batteryNotes: serviceRecords.batteryNotes,
  createdAt: serviceRecords.createdAt,
  customerFullName: customers.fullName,
  customerPhone: customers.phone,
  chassisNumber: vehicles.chassisNumber,
  modelName: models.name,
  brandName: brands.name,
  vehicleType: models.vehicleType,
  performedByName: user.name,
};

type ServiceRow = {
  id: string;
  vehicleId: string;
  customerId: string;
  serviceType: ServiceRecordListItemDTO["serviceType"];
  odometerKm: number | null;
  description: string;
  performedAt: Date;
  performedBy: string;
  batteryHealthPercent: number | null;
  batteryNotes: string | null;
  createdAt: Date;
  customerFullName: string;
  customerPhone: string;
  chassisNumber: string | null;
  modelName: string;
  brandName: string;
  vehicleType: "ice" | "ev";
  performedByName: string;
};

function mapServiceRow(row: ServiceRow): ServiceRecordListItemDTO {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    customerId: row.customerId,
    serviceType: row.serviceType,
    odometerKm: row.odometerKm,
    description: row.description,
    performedAt: row.performedAt,
    performedBy: row.performedBy,
    batteryHealthPercent: row.batteryHealthPercent,
    batteryNotes: row.batteryNotes,
    createdAt: row.createdAt,
    customer: {
      id: row.customerId,
      fullName: row.customerFullName,
      phone: row.customerPhone,
    },
    vehicle: {
      id: row.vehicleId,
      chassisNumber: row.chassisNumber,
      modelName: row.modelName,
      brandName: row.brandName,
      vehicleType: row.vehicleType,
    },
    performedByUser: {
      id: row.performedBy,
      name: row.performedByName,
    },
  };
}

function serviceFrom(client: DbTransaction) {
  return client
    .select(serviceSelect)
    .from(serviceRecords)
    .innerJoin(customers, eq(customers.id, serviceRecords.customerId))
    .innerJoin(vehicles, eq(vehicles.id, serviceRecords.vehicleId))
    .innerJoin(models, eq(models.id, vehicles.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .innerJoin(user, eq(user.id, serviceRecords.performedBy));
}

function buildServiceFilters(query: ServiceRecordsListQueryDTO) {
  const conditions = [];
  if (query.vehicleId) {
    conditions.push(eq(serviceRecords.vehicleId, query.vehicleId));
  }
  if (query.customerId) {
    conditions.push(eq(serviceRecords.customerId, query.customerId));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function listServiceRecords(
  query: ServiceRecordsListQueryDTO,
  client: DbTransaction,
) {
  const whereExpr = buildServiceFilters(query);

  const countRow = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(serviceRecords)
    .where(whereExpr);
  const total = countRow[0]?.count ?? 0;

  let base = serviceFrom(client);
  if (whereExpr) base = base.where(whereExpr) as typeof base;

  const rows = (await base
    .orderBy(desc(serviceRecords.performedAt), desc(serviceRecords.createdAt))
    .limit(query.limit)
    .offset(query.offset)) as ServiceRow[];

  return {
    data: rows.map(mapServiceRow),
    meta: { total, limit: query.limit, offset: query.offset },
  };
}

export async function getVehicleServiceHistory(
  vehicleId: string,
  client: DbTransaction,
) {
  return listServiceRecords(
    { vehicleId, limit: 100, offset: 0 },
    client,
  );
}

export async function getServiceRecordById(id: string, client: DbTransaction) {
  const rows = (await serviceFrom(client)
    .where(eq(serviceRecords.id, id))
    .limit(1)) as ServiceRow[];
  const row = rows[0];
  if (!row) return null;
  return mapServiceRow(row);
}

export async function hasSalesLinkForService(
  vehicleId: string,
  customerId: string,
  client: DbTransaction,
) {
  const rows = await client
    .select({ id: salesOrders.id })
    .from(salesOrders)
    .where(
      and(
        eq(salesOrders.vehicleId, vehicleId),
        eq(salesOrders.customerId, customerId),
        sql`${salesOrders.status} in ('confirmed', 'completed')`,
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function insertServiceRecord(
  input: CreateServiceRecordDTO & {
    performedBy: string;
    performedAt: Date;
    createdAt: Date;
  },
  client: DbTransaction,
) {
  const [created] = await client
    .insert(serviceRecords)
    .values({
      vehicleId: input.vehicleId,
      customerId: input.customerId,
      serviceType: input.serviceType,
      odometerKm: input.odometerKm ?? null,
      description: input.description,
      performedAt: input.performedAt,
      performedBy: input.performedBy,
      batteryHealthPercent: input.batteryHealthPercent ?? null,
      batteryNotes: input.batteryNotes?.trim() || null,
      createdAt: input.createdAt,
    })
    .returning({ id: serviceRecords.id });
  if (!created) return null;
  return getServiceRecordById(created.id, client);
}
