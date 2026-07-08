import { format } from "date-fns";
import { and, eq, gte, lt, lte, ne, sql } from "drizzle-orm";
import { user } from "@/server/platform/db/schema/auth";
import { customers } from "@/server/platform/db/schema/customers";
import {
  brands,
  colors,
  models,
  vehicles,
} from "@/server/platform/db/schema/inventory";
import {
  financeCompanies,
  paymentSchedules,
  salesOrders,
} from "@/server/platform/db/schema/sales";
import { buildOrderBy, buildWhereGroups } from "@/shared/db/query";
import type { DbTransaction } from "@/shared/types";
import type { SalesOrdersListQueryDTO } from "../contracts";

const listColumns = {
  id: salesOrders.id,
  orderNumber: salesOrders.orderNumber,
  vehicleId: salesOrders.vehicleId,
  customerId: salesOrders.customerId,
  salespersonId: salesOrders.salespersonId,
  salePrice: salesOrders.salePrice,
  saleCurrency: salesOrders.saleCurrency,
  paymentType: salesOrders.paymentType,
  status: salesOrders.status,
  soldAt: salesOrders.soldAt,
  createdAt: salesOrders.createdAt,
  updatedAt: salesOrders.updatedAt,
} as const;

const orderSelect = {
  id: salesOrders.id,
  orderNumber: salesOrders.orderNumber,
  vehicleId: salesOrders.vehicleId,
  customerId: salesOrders.customerId,
  salespersonId: salesOrders.salespersonId,
  salePrice: salesOrders.salePrice,
  saleCurrency: salesOrders.saleCurrency,
  exchangeRateUsed: salesOrders.exchangeRateUsed,
  paymentType: salesOrders.paymentType,
  status: salesOrders.status,
  financeCompanyId: salesOrders.financeCompanyId,
  financeApprovedAmount: salesOrders.financeApprovedAmount,
  financeTransferReceived: salesOrders.financeTransferReceived,
  financeTransferDate: salesOrders.financeTransferDate,
  downPayment: salesOrders.downPayment,
  downPaymentCurrency: salesOrders.downPaymentCurrency,
  installmentMonths: salesOrders.installmentMonths,
  interestRatePercent: salesOrders.interestRatePercent,
  monthlyInstallment: salesOrders.monthlyInstallment,
  notes: salesOrders.notes,
  soldAt: salesOrders.soldAt,
  createdBy: salesOrders.createdBy,
  createdAt: salesOrders.createdAt,
  updatedAt: salesOrders.updatedAt,
  customerFullName: customers.fullName,
  customerPhone: customers.phone,
  vehicleStatus: vehicles.status,
  chassisNumber: vehicles.chassisNumber,
  modelName: models.name,
  brandName: brands.name,
  colorName: colors.name,
  salespersonName: user.name,
  financeCompanyName: financeCompanies.name,
  financeCompanyCode: financeCompanies.code,
} as const;

type OrderRow = {
  id: string;
  orderNumber: string;
  vehicleId: string;
  customerId: string;
  salespersonId: string;
  salePrice: string;
  saleCurrency: "LAK" | "THB" | "USD";
  exchangeRateUsed: string | null;
  paymentType: "cash" | "bank_finance" | "in_house_leasing";
  status: "draft" | "confirmed" | "completed" | "cancelled";
  financeCompanyId: string | null;
  financeApprovedAmount: string | null;
  financeTransferReceived: boolean;
  financeTransferDate: string | null;
  downPayment: string | null;
  downPaymentCurrency: "LAK" | "THB" | "USD" | null;
  installmentMonths: number | null;
  interestRatePercent: string | null;
  monthlyInstallment: string | null;
  notes: string | null;
  soldAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  customerFullName: string;
  customerPhone: string;
  vehicleStatus: string;
  chassisNumber: string | null;
  modelName: string;
  brandName: string;
  colorName: string;
  salespersonName: string;
  financeCompanyName: string | null;
  financeCompanyCode: string | null;
};

function mapOrderRow(row: OrderRow) {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    vehicleId: row.vehicleId,
    customerId: row.customerId,
    salespersonId: row.salespersonId,
    salePrice: row.salePrice,
    saleCurrency: row.saleCurrency,
    exchangeRateUsed: row.exchangeRateUsed,
    paymentType: row.paymentType,
    status: row.status,
    financeCompanyId: row.financeCompanyId,
    financeApprovedAmount: row.financeApprovedAmount,
    financeTransferReceived: row.financeTransferReceived,
    financeTransferDate: row.financeTransferDate,
    downPayment: row.downPayment,
    downPaymentCurrency: row.downPaymentCurrency,
    installmentMonths: row.installmentMonths,
    interestRatePercent: row.interestRatePercent,
    monthlyInstallment: row.monthlyInstallment,
    notes: row.notes,
    soldAt: row.soldAt,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    customer: {
      id: row.customerId,
      fullName: row.customerFullName,
      phone: row.customerPhone,
    },
    vehicle: {
      id: row.vehicleId,
      status: row.vehicleStatus,
      chassisNumber: row.chassisNumber,
      modelName: row.modelName,
      brandName: row.brandName,
      colorName: row.colorName,
    },
    salesperson: {
      id: row.salespersonId,
      name: row.salespersonName,
    },
    financeCompany: row.financeCompanyId
      ? {
          id: row.financeCompanyId,
          name: row.financeCompanyName ?? "",
          code: row.financeCompanyCode ?? "",
        }
      : null,
  };
}

function orderJoins<T extends { from: typeof salesOrders }>(base: T) {
  return base
    .innerJoin(customers, eq(customers.id, salesOrders.customerId))
    .innerJoin(vehicles, eq(vehicles.id, salesOrders.vehicleId))
    .innerJoin(models, eq(models.id, vehicles.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .innerJoin(colors, eq(colors.id, vehicles.colorId))
    .innerJoin(user, eq(user.id, salesOrders.salespersonId))
    .leftJoin(
      financeCompanies,
      eq(financeCompanies.id, salesOrders.financeCompanyId),
    );
}

export async function generateOrderNumber(client: DbTransaction) {
  const now = new Date();
  const datePart = format(now, "yyyyMMdd");
  const prefix = `SO-${datePart}-`;

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const countRow = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(salesOrders)
    .where(
      and(
        gte(salesOrders.createdAt, start),
        lt(salesOrders.createdAt, end),
      ),
    );

  const seq = (countRow[0]?.count ?? 0) + 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function findActiveOrderForVehicle(
  vehicleId: string,
  client: DbTransaction,
  excludeOrderId?: string,
) {
  const conditions = [
    eq(salesOrders.vehicleId, vehicleId),
    ne(salesOrders.status, "cancelled"),
  ];
  if (excludeOrderId) {
    conditions.push(ne(salesOrders.id, excludeOrderId));
  }

  const rows = await client
    .select({ id: salesOrders.id, status: salesOrders.status })
    .from(salesOrders)
    .where(and(...conditions))
    .limit(1);

  return rows[0] ?? null;
}

export async function listSalesOrders(
  query: SalesOrdersListQueryDTO,
  client: DbTransaction,
) {
  const extraFilters = [];
  if (query.status) extraFilters.push(eq(salesOrders.status, query.status));
  if (query.paymentType)
    extraFilters.push(eq(salesOrders.paymentType, query.paymentType));
  if (query.customerId)
    extraFilters.push(eq(salesOrders.customerId, query.customerId));
  if (query.vehicleId)
    extraFilters.push(eq(salesOrders.vehicleId, query.vehicleId));

  if (query.dateField && query.dateFrom) {
    const col =
      query.dateField === "soldAt"
        ? salesOrders.soldAt
        : salesOrders.createdAt;
    extraFilters.push(gte(col, new Date(query.dateFrom)));
  }
  if (query.dateField && query.dateTo) {
    const col =
      query.dateField === "soldAt"
        ? salesOrders.soldAt
        : salesOrders.createdAt;
    const end = new Date(query.dateTo);
    end.setHours(23, 59, 59, 999);
    extraFilters.push(lte(col, end));
  }

  const whereExpr = buildWhereGroups(listColumns, query.filters ?? []);
  const combinedWhere =
    extraFilters.length > 0 || whereExpr
      ? and(whereExpr ?? sql`true`, ...extraFilters)
      : undefined;

  const orderBy = buildOrderBy(listColumns, query.sort);

  const countRow = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(salesOrders)
    .where(combinedWhere);
  const total = countRow[0]?.count ?? 0;

  let base = orderJoins(client.select(orderSelect).from(salesOrders));
  if (combinedWhere) base = base.where(combinedWhere) as typeof base;
  if (orderBy?.length) base = base.orderBy(...orderBy) as typeof base;
  else base = base.orderBy(sql`${salesOrders.createdAt} desc`) as typeof base;

  const rows = await base.limit(query.limit).offset(query.offset);
  return {
    data: rows.map((row) => mapOrderRow(row as OrderRow)),
    meta: { total, limit: query.limit, offset: query.offset },
  };
}

export async function getSalesOrderById(id: string, client: DbTransaction) {
  const rows = await orderJoins(
    client.select(orderSelect).from(salesOrders).where(eq(salesOrders.id, id)),
  ).limit(1);

  const row = rows[0];
  if (!row) return null;

  const schedules = await client
    .select({
      id: paymentSchedules.id,
      installmentNumber: paymentSchedules.installmentNumber,
      dueDate: paymentSchedules.dueDate,
      amount: paymentSchedules.amount,
      currency: paymentSchedules.currency,
      status: paymentSchedules.status,
    })
    .from(paymentSchedules)
    .where(eq(paymentSchedules.salesOrderId, id))
    .orderBy(paymentSchedules.installmentNumber);

  return {
    ...mapOrderRow(row as OrderRow),
    paymentSchedules: schedules.map((s) => ({
      ...s,
      dueDate: s.dueDate,
    })),
  };
}

export async function insertSalesOrder(
  values: typeof salesOrders.$inferInsert,
  client: DbTransaction,
) {
  const [created] = await client
    .insert(salesOrders)
    .values(values)
    .returning({ id: salesOrders.id });
  if (!created) return null;
  return getSalesOrderById(created.id, client);
}

export async function updateSalesOrderById(
  id: string,
  values: Partial<typeof salesOrders.$inferInsert>,
  client: DbTransaction,
) {
  const [updated] = await client
    .update(salesOrders)
    .set(values)
    .where(eq(salesOrders.id, id))
    .returning({ id: salesOrders.id });
  if (!updated) return null;
  return getSalesOrderById(updated.id, client);
}

export async function getSalesOrderSnapshot(id: string, client: DbTransaction) {
  const rows = await client
    .select({
      id: salesOrders.id,
      orderNumber: salesOrders.orderNumber,
      vehicleId: salesOrders.vehicleId,
      customerId: salesOrders.customerId,
      status: salesOrders.status,
      paymentType: salesOrders.paymentType,
      financeCompanyId: salesOrders.financeCompanyId,
      financeTransferReceived: salesOrders.financeTransferReceived,
      salePrice: salesOrders.salePrice,
      saleCurrency: salesOrders.saleCurrency,
      soldAt: salesOrders.soldAt,
    })
    .from(salesOrders)
    .where(eq(salesOrders.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function countSalesOrdersByCustomerId(
  customerId: string,
  client: DbTransaction,
) {
  const countRow = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(salesOrders)
    .where(eq(salesOrders.customerId, customerId));
  return countRow[0]?.count ?? 0;
}
