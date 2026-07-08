import {
  addDays,
  eachDayOfInterval,
  endOfDay,
  format,
  startOfDay,
} from "date-fns";
import { and, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import {
  serviceRecords,
  warranties,
} from "@/server/platform/db/schema/after-sales";
import { customers } from "@/server/platform/db/schema/customers";
import { models, vehicles } from "@/server/platform/db/schema/inventory";
import {
  paymentAccounts,
  payments,
} from "@/server/platform/db/schema/payments";
import { salesOrders } from "@/server/platform/db/schema/sales";
import type { DbTransaction } from "@/shared/types";
import type { DashboardKpisDTO, DashboardQueryDTO } from "../contracts";
import { resolveReportPeriod } from "../lib/resolve-report-period";

const SALE_STATUSES = ["confirmed", "completed"] as const;

function saleAtExpr() {
  return sql`coalesce(${salesOrders.soldAt}, ${salesOrders.createdAt})`;
}

async function getInventoryCounts(client: DbTransaction) {
  const statusRows = await client
    .select({
      status: vehicles.status,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(vehicles)
    .where(ne(vehicles.status, "written_off"))
    .groupBy(vehicles.status);

  const typeRows = await client
    .select({
      vehicleType: models.vehicleType,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(vehicles)
    .innerJoin(models, eq(models.id, vehicles.modelId))
    .where(ne(vehicles.status, "written_off"))
    .groupBy(models.vehicleType);

  const byStatus = Object.fromEntries(
    statusRows.map((row) => [row.status, row.count]),
  );
  const byType = Object.fromEntries(
    typeRows.map((row) => [row.vehicleType, row.count]),
  );

  return {
    inStock: byStatus.in_stock ?? 0,
    reserved: byStatus.reserved ?? 0,
    sold: byStatus.sold ?? 0,
    inService: byStatus.in_service ?? 0,
    evCount: byType.ev ?? 0,
    iceCount: byType.ice ?? 0,
  };
}

async function getSalesAggregates(
  dateFrom: Date,
  dateTo: Date,
  client: DbTransaction,
) {
  const periodFilter = and(
    inArray(salesOrders.status, [...SALE_STATUSES]),
    gte(saleAtExpr(), dateFrom),
    lte(saleAtExpr(), dateTo),
  );

  const statusRows = await client
    .select({
      status: salesOrders.status,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(salesOrders)
    .where(periodFilter)
    .groupBy(salesOrders.status);

  const currencyRows = await client
    .select({
      currency: salesOrders.saleCurrency,
      totalAmount: sql<string>`coalesce(sum(${salesOrders.salePrice}), 0)`,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(salesOrders)
    .where(periodFilter)
    .groupBy(salesOrders.saleCurrency);

  const paymentTypeRows = await client
    .select({
      paymentType: salesOrders.paymentType,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(salesOrders)
    .where(periodFilter)
    .groupBy(salesOrders.paymentType);

  const statusCounts = Object.fromEntries(
    statusRows.map((row) => [row.status, row.count]),
  );

  return {
    confirmedCount: statusCounts.confirmed ?? 0,
    completedCount: statusCounts.completed ?? 0,
    byCurrency: currencyRows.map((row) => ({
      currency: row.currency,
      totalAmount: row.totalAmount,
      count: row.count,
    })),
    byPaymentType: paymentTypeRows.map((row) => ({
      paymentType: row.paymentType,
      count: row.count,
    })),
  };
}

async function getPaymentsAggregates(
  dateFrom: Date,
  dateTo: Date,
  client: DbTransaction,
) {
  const pendingRows = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(payments)
    .where(eq(payments.status, "pending"));
  const pendingCount = pendingRows[0]?.count ?? 0;

  const verifiedPeriodRows = await client
    .select({
      currency: payments.currency,
      totalAmount: sql<string>`coalesce(sum(${payments.amount}), 0)`,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.status, "verified"),
        gte(payments.paidAt, dateFrom),
        lte(payments.paidAt, dateTo),
      ),
    )
    .groupBy(payments.currency);

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const verifiedTodayRows = await client
    .select({
      accountId: payments.paymentAccountId,
      accountName: paymentAccounts.name,
      currency: paymentAccounts.currency,
      total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .innerJoin(
      paymentAccounts,
      eq(paymentAccounts.id, payments.paymentAccountId),
    )
    .where(
      and(
        eq(payments.status, "verified"),
        gte(payments.paidAt, todayStart),
        lte(payments.paidAt, todayEnd),
      ),
    )
    .groupBy(
      payments.paymentAccountId,
      paymentAccounts.name,
      paymentAccounts.currency,
    );

  return {
    pendingCount,
    verifiedInPeriodByCurrency: verifiedPeriodRows.map((row) => ({
      currency: row.currency,
      totalAmount: row.totalAmount,
      count: row.count,
    })),
    verifiedTodayByAccount: verifiedTodayRows.map((row) => ({
      accountId: row.accountId,
      name: row.accountName,
      total: row.total,
      currency: row.currency,
    })),
  };
}

async function getAfterSalesAggregates(
  dateFrom: Date,
  dateTo: Date,
  client: DbTransaction,
) {
  const today = startOfDay(new Date());
  const horizon = addDays(today, 30);

  const expiringRows = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(warranties)
    .where(
      and(
        eq(warranties.status, "active"),
        gte(warranties.endDate, today),
        lte(warranties.endDate, horizon),
      ),
    );
  const warrantiesExpiring30 = expiringRows[0]?.count ?? 0;

  const serviceRows = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(serviceRecords)
    .where(
      and(
        gte(serviceRecords.performedAt, dateFrom),
        lte(serviceRecords.performedAt, dateTo),
      ),
    );
  const serviceRecordsInPeriod = serviceRows[0]?.count ?? 0;

  return { warrantiesExpiring30, serviceRecordsInPeriod };
}

async function getSalesTrend(
  dateFrom: Date,
  dateTo: Date,
  client: DbTransaction,
) {
  const dayExpr = sql<string>`to_char(${saleAtExpr()}, 'YYYY-MM-DD')`;

  const rows = await client
    .select({
      date: dayExpr,
      currency: salesOrders.saleCurrency,
      count: sql<number>`cast(count(*) as int)`,
      totalAmount: sql<string>`coalesce(sum(${salesOrders.salePrice}), 0)`,
    })
    .from(salesOrders)
    .where(
      and(
        inArray(salesOrders.status, [...SALE_STATUSES]),
        gte(saleAtExpr(), dateFrom),
        lte(saleAtExpr(), dateTo),
      ),
    )
    .groupBy(dayExpr, salesOrders.saleCurrency)
    .orderBy(dayExpr);

  const byDate = new Map<
    string,
    { count: number; amountByCurrency: Record<string, string> }
  >();

  for (const row of rows) {
    const existing = byDate.get(row.date) ?? {
      count: 0,
      amountByCurrency: {},
    };
    existing.count += row.count;
    existing.amountByCurrency[row.currency] = row.totalAmount;
    byDate.set(row.date, existing);
  }

  const days = eachDayOfInterval({ start: dateFrom, end: dateTo });
  return days.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    const entry = byDate.get(key);
    return {
      date: key,
      count: entry?.count ?? 0,
      amountByCurrency: entry?.amountByCurrency ?? {},
    };
  });
}

async function getRecentSales(client: DbTransaction) {
  const rows = await client
    .select({
      id: salesOrders.id,
      orderNumber: salesOrders.orderNumber,
      customerName: customers.fullName,
      salePrice: salesOrders.salePrice,
      saleCurrency: salesOrders.saleCurrency,
      status: salesOrders.status,
      soldAt: salesOrders.soldAt,
      createdAt: salesOrders.createdAt,
    })
    .from(salesOrders)
    .innerJoin(customers, eq(customers.id, salesOrders.customerId))
    .where(ne(salesOrders.status, "cancelled"))
    .orderBy(sql`${salesOrders.createdAt} desc`)
    .limit(5);

  return rows.map((row) => ({
    id: row.id,
    orderNumber: row.orderNumber,
    customerName: row.customerName,
    salePrice: row.salePrice,
    saleCurrency: row.saleCurrency,
    status: row.status,
    soldAt: row.soldAt ? row.soldAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getDashboardKpis(
  query: DashboardQueryDTO,
  client: DbTransaction,
): Promise<DashboardKpisDTO> {
  const { dateFrom, dateTo, preset } = resolveReportPeriod(query);

  const [
    inventory,
    sales,
    payments,
    afterSales,
    salesByDay,
    recentSales,
  ] = await Promise.all([
    getInventoryCounts(client),
    getSalesAggregates(dateFrom, dateTo, client),
    getPaymentsAggregates(dateFrom, dateTo, client),
    getAfterSalesAggregates(dateFrom, dateTo, client),
    getSalesTrend(dateFrom, dateTo, client),
    getRecentSales(client),
  ]);

  return {
    period: {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      preset,
    },
    inventory,
    sales,
    payments,
    afterSales,
    trends: { salesByDay },
    recentSales,
  };
}
