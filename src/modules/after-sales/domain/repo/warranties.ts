import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { warranties } from "@/server/platform/db/schema/after-sales";
import { customers } from "@/server/platform/db/schema/customers";
import { brands, models, vehicles } from "@/server/platform/db/schema/inventory";
import { salesOrders } from "@/server/platform/db/schema/sales";
import type { DbTransaction } from "@/shared/types";
import type {
  ExpiringWarrantiesQueryDTO,
  WarrantyListItemDTO,
  WarrantyType,
  WarrantiesListQueryDTO,
} from "../contracts";

const warrantySelect = {
  id: warranties.id,
  vehicleId: warranties.vehicleId,
  customerId: warranties.customerId,
  salesOrderId: warranties.salesOrderId,
  warrantyType: warranties.warrantyType,
  startDate: warranties.startDate,
  endDate: warranties.endDate,
  durationMonths: warranties.durationMonths,
  batterySerialNumber: warranties.batterySerialNumber,
  status: warranties.status,
  notes: warranties.notes,
  createdAt: warranties.createdAt,
  updatedAt: warranties.updatedAt,
  customerFullName: customers.fullName,
  customerPhone: customers.phone,
  chassisNumber: vehicles.chassisNumber,
  modelName: models.name,
  brandName: brands.name,
  orderNumber: salesOrders.orderNumber,
};

type WarrantyRow = {
  id: string;
  vehicleId: string;
  customerId: string;
  salesOrderId: string;
  warrantyType: WarrantyType;
  startDate: Date;
  endDate: Date;
  durationMonths: number;
  batterySerialNumber: string | null;
  status: WarrantyListItemDTO["status"];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  customerFullName: string;
  customerPhone: string;
  chassisNumber: string | null;
  modelName: string;
  brandName: string;
  orderNumber: string;
};

function mapWarrantyRow(row: WarrantyRow, today = startOfDay(new Date())): WarrantyListItemDTO {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    customerId: row.customerId,
    salesOrderId: row.salesOrderId,
    warrantyType: row.warrantyType,
    startDate: row.startDate,
    endDate: row.endDate,
    durationMonths: row.durationMonths,
    batterySerialNumber: row.batterySerialNumber,
    status: row.status,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    daysRemaining: differenceInCalendarDays(startOfDay(row.endDate), today),
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
    },
    salesOrder: {
      id: row.salesOrderId,
      orderNumber: row.orderNumber,
    },
  };
}

function buildWarrantyFilters(
  query: WarrantiesListQueryDTO,
  today = startOfDay(new Date()),
) {
  const conditions = [];

  if (query.salesOrderId) {
    conditions.push(eq(warranties.salesOrderId, query.salesOrderId));
  }
  if (query.warrantyType) {
    conditions.push(eq(warranties.warrantyType, query.warrantyType));
  }
  if (query.status) {
    conditions.push(eq(warranties.status, query.status));
  }
  if (query.expiringSoon === "true") {
    conditions.push(eq(warranties.status, "active"));
    conditions.push(gte(warranties.endDate, today));
    conditions.push(lte(warranties.endDate, addDays(today, 30)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function warrantyFrom(client: DbTransaction) {
  return client
    .select(warrantySelect)
    .from(warranties)
    .innerJoin(customers, eq(customers.id, warranties.customerId))
    .innerJoin(vehicles, eq(vehicles.id, warranties.vehicleId))
    .innerJoin(models, eq(models.id, vehicles.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .innerJoin(salesOrders, eq(salesOrders.id, warranties.salesOrderId));
}

export async function listWarranties(
  query: WarrantiesListQueryDTO,
  client: DbTransaction,
) {
  const today = startOfDay(new Date());
  const whereExpr = buildWarrantyFilters(query, today);

  const countRow = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(warranties)
    .innerJoin(customers, eq(customers.id, warranties.customerId))
    .innerJoin(vehicles, eq(vehicles.id, warranties.vehicleId))
    .innerJoin(models, eq(models.id, vehicles.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .innerJoin(salesOrders, eq(salesOrders.id, warranties.salesOrderId))
    .where(whereExpr);
  const total = countRow[0]?.count ?? 0;

  let base = warrantyFrom(client);
  if (whereExpr) base = base.where(whereExpr) as typeof base;

  const rows = (await base
    .orderBy(asc(warranties.endDate), desc(warranties.createdAt))
    .limit(query.limit)
    .offset(query.offset)) as WarrantyRow[];

  return {
    data: rows.map((row) => mapWarrantyRow(row, today)),
    meta: { total, limit: query.limit, offset: query.offset },
  };
}

export async function getWarrantyById(id: string, client: DbTransaction) {
  const rows = (await warrantyFrom(client)
    .where(eq(warranties.id, id))
    .limit(1)) as WarrantyRow[];
  const row = rows[0];
  if (!row) return null;
  return mapWarrantyRow(row);
}

export async function listExpiringWarranties(
  query: ExpiringWarrantiesQueryDTO,
  client: DbTransaction,
) {
  const today = startOfDay(new Date());
  const horizon = addDays(today, query.days);
  const whereExpr = and(
    eq(warranties.status, "active"),
    gte(warranties.endDate, today),
    lte(warranties.endDate, horizon),
  );

  const rows = (await warrantyFrom(client)
    .where(whereExpr)
    .orderBy(asc(warranties.endDate))
    .limit(query.limit)) as WarrantyRow[];

  return {
    days: query.days,
    count: rows.length,
    items: rows.map((row) => mapWarrantyRow(row, today)),
  };
}

export async function listWarrantiesBySalesOrderId(
  salesOrderId: string,
  client: DbTransaction,
) {
  const result = await listWarranties(
    { salesOrderId, limit: 100, offset: 0 },
    client,
  );
  return result.data;
}

export async function countWarrantiesBySalesOrderId(
  salesOrderId: string,
  client: DbTransaction,
) {
  const result = await listWarranties(
    { salesOrderId, limit: 1, offset: 0 },
    client,
  );
  return result.meta.total;
}

export async function insertWarranty(
  values: {
    vehicleId: string;
    customerId: string;
    salesOrderId: string;
    warrantyType: WarrantyType;
    startDate: Date;
    endDate: Date;
    durationMonths: number;
    batterySerialNumber?: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
  client: DbTransaction,
) {
  const [created] = await client
    .insert(warranties)
    .values({
      vehicleId: values.vehicleId,
      customerId: values.customerId,
      salesOrderId: values.salesOrderId,
      warrantyType: values.warrantyType,
      startDate: values.startDate,
      endDate: values.endDate,
      durationMonths: values.durationMonths,
      batterySerialNumber: values.batterySerialNumber ?? null,
      status: "active",
      createdAt: values.createdAt,
      updatedAt: values.updatedAt,
    })
    .returning({ id: warranties.id });
  if (!created) return null;
  return getWarrantyById(created.id, client);
}
