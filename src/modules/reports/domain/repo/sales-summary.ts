import { and, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { customers } from "@/server/platform/db/schema/customers";
import { brands, models, vehicles } from "@/server/platform/db/schema/inventory";
import { salesOrders } from "@/server/platform/db/schema/sales";
import { buildOrderBy } from "@/shared/db/query";
import type { DbTransaction } from "@/shared/types";
import type { SalesReportDTO, SalesReportQueryDTO } from "../contracts";
import { resolveReportPeriod } from "../lib/resolve-report-period";

const SALE_STATUSES = ["confirmed", "completed"] as const;

const listColumns = {
  id: salesOrders.id,
  orderNumber: salesOrders.orderNumber,
  salePrice: salesOrders.salePrice,
  saleCurrency: salesOrders.saleCurrency,
  paymentType: salesOrders.paymentType,
  status: salesOrders.status,
  soldAt: salesOrders.soldAt,
  createdAt: salesOrders.createdAt,
} as const;

function saleAtExpr() {
  return sql`coalesce(${salesOrders.soldAt}, ${salesOrders.createdAt})`;
}

function periodFilter(dateFrom: Date, dateTo: Date) {
  return and(
    ne(salesOrders.status, "cancelled"),
    gte(saleAtExpr(), dateFrom),
    lte(saleAtExpr(), dateTo),
  );
}

async function getSummary(
  dateFrom: Date,
  dateTo: Date,
  client: DbTransaction,
): Promise<SalesReportDTO["summary"]> {
  const whereExpr = periodFilter(dateFrom, dateTo);

  const statusRows = await client
    .select({
      status: salesOrders.status,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(salesOrders)
    .where(whereExpr)
    .groupBy(salesOrders.status);

  const paymentTypeRows = await client
    .select({
      paymentType: salesOrders.paymentType,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(salesOrders)
    .where(whereExpr)
    .groupBy(salesOrders.paymentType);

  const revenueFilter = and(
    whereExpr,
    inArray(salesOrders.status, [...SALE_STATUSES]),
  );

  const currencyRows = await client
    .select({
      currency: salesOrders.saleCurrency,
      totalAmount: sql<string>`coalesce(sum(${salesOrders.salePrice}), 0)`,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(salesOrders)
    .where(revenueFilter)
    .groupBy(salesOrders.saleCurrency);

  const totalRow = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(salesOrders)
    .where(whereExpr);

  return {
    totalOrders: totalRow[0]?.count ?? 0,
    byStatus: statusRows.map((row) => ({
      status: row.status,
      count: row.count,
    })),
    byPaymentType: paymentTypeRows.map((row) => ({
      paymentType: row.paymentType,
      count: row.count,
    })),
    byCurrency: currencyRows.map((row) => ({
      currency: row.currency,
      totalAmount: row.totalAmount,
      count: row.count,
    })),
  };
}

export async function getSalesReport(
  query: SalesReportQueryDTO,
  client: DbTransaction,
): Promise<SalesReportDTO> {
  const { dateFrom, dateTo, preset } = resolveReportPeriod(query);
  const whereExpr = periodFilter(dateFrom, dateTo);

  const summary = await getSummary(dateFrom, dateTo, client);

  const countRow = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(salesOrders)
    .where(whereExpr);
  const total = countRow[0]?.count ?? 0;

  const orderBy = buildOrderBy(listColumns, query.sort);
  let base = client
    .select({
      id: salesOrders.id,
      orderNumber: salesOrders.orderNumber,
      salePrice: salesOrders.salePrice,
      saleCurrency: salesOrders.saleCurrency,
      paymentType: salesOrders.paymentType,
      status: salesOrders.status,
      soldAt: salesOrders.soldAt,
      createdAt: salesOrders.createdAt,
      customerFullName: customers.fullName,
      customerPhone: customers.phone,
      chassisNumber: vehicles.chassisNumber,
      modelName: models.name,
      brandName: brands.name,
    })
    .from(salesOrders)
    .innerJoin(customers, eq(customers.id, salesOrders.customerId))
    .innerJoin(vehicles, eq(vehicles.id, salesOrders.vehicleId))
    .innerJoin(models, eq(models.id, vehicles.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(whereExpr);

  if (orderBy?.length) {
    base = base.orderBy(...orderBy) as typeof base;
  } else {
    base = base.orderBy(desc(salesOrders.createdAt)) as typeof base;
  }

  const rows = await base.limit(query.limit).offset(query.offset);

  return {
    period: {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      preset,
    },
    summary,
    data: rows.map((row) => ({
      id: row.id,
      orderNumber: row.orderNumber,
      salePrice: row.salePrice,
      saleCurrency: row.saleCurrency,
      paymentType: row.paymentType,
      status: row.status,
      soldAt: row.soldAt ? row.soldAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      customer: {
        fullName: row.customerFullName,
        phone: row.customerPhone,
      },
      vehicle: {
        brandName: row.brandName,
        modelName: row.modelName,
        chassisNumber: row.chassisNumber,
      },
    })),
    meta: {
      total,
      limit: query.limit,
      offset: query.offset,
    },
  };
}
