import { format } from "date-fns";
import { and, desc, eq, gte, lte, ne } from "drizzle-orm";
import { customers } from "@/server/platform/db/schema/customers";
import { brands, colors, models, vehicles } from "@/server/platform/db/schema/inventory";
import {
  paymentAccounts,
  payments,
} from "@/server/platform/db/schema/payments";
import { salesOrders } from "@/server/platform/db/schema/sales";
import { formatDateTimeLocal } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import type {
  InventoryReportQueryDTO,
  PaymentsReportQueryDTO,
  SalesReportQueryDTO,
} from "../contracts";
import { type CsvExportResult, rowsToCsv } from "../lib/csv";
import { resolveReportPeriod } from "../lib/resolve-report-period";
import { getSalesReport } from "./sales-summary";

const EXPORT_ROW_LIMIT = 10_000;

function csvFilename(prefix: string, suffix?: string) {
  const datePart = format(new Date(), "yyyyMMdd-HHmm");
  return `${prefix}-${datePart}${suffix ? `-${suffix}` : ""}.csv`;
}

export async function exportSalesReportCsv(
  query: SalesReportQueryDTO,
  client: DbTransaction,
): Promise<CsvExportResult> {
  const report = await getSalesReport(
    { ...query, offset: 0, limit: EXPORT_ROW_LIMIT },
    client,
  );

  const headers = [
    "orderNumber",
    "customerName",
    "customerPhone",
    "brand",
    "model",
    "chassisNumber",
    "salePrice",
    "saleCurrency",
    "paymentType",
    "status",
    "soldAt",
    "createdAt",
  ];

  const rows = report.data.map((row) => [
    row.orderNumber,
    row.customer.fullName,
    row.customer.phone,
    row.vehicle.brandName,
    row.vehicle.modelName,
    row.vehicle.chassisNumber ?? "",
    row.salePrice,
    row.saleCurrency,
    row.paymentType,
    row.status,
    row.soldAt ? formatDateTimeLocal(row.soldAt) : "",
    formatDateTimeLocal(row.createdAt),
  ]);

  return {
    filename: csvFilename("sales-report", report.period.preset),
    content: rowsToCsv(headers, rows),
  };
}

export async function exportPaymentsReportCsv(
  query: PaymentsReportQueryDTO,
  client: DbTransaction,
): Promise<CsvExportResult> {
  const { dateFrom, dateTo, preset } = resolveReportPeriod(query);

  const rows = await client
    .select({
      paymentNumber: payments.paymentNumber,
      accountName: paymentAccounts.name,
      amount: payments.amount,
      currency: payments.currency,
      paymentMethod: payments.paymentMethod,
      paidAt: payments.paidAt,
      status: payments.status,
      orderNumber: salesOrders.orderNumber,
      customerName: customers.fullName,
    })
    .from(payments)
    .innerJoin(
      paymentAccounts,
      eq(paymentAccounts.id, payments.paymentAccountId),
    )
    .leftJoin(salesOrders, eq(salesOrders.id, payments.salesOrderId))
    .leftJoin(customers, eq(customers.id, salesOrders.customerId))
    .where(
      and(
        eq(payments.status, "verified"),
        gte(payments.paidAt, dateFrom),
        lte(payments.paidAt, dateTo),
      ),
    )
    .orderBy(desc(payments.paidAt))
    .limit(EXPORT_ROW_LIMIT);

  const headers = [
    "paymentNumber",
    "accountName",
    "amount",
    "currency",
    "paymentMethod",
    "paidAt",
    "status",
    "orderNumber",
    "customerName",
  ];

  const data = rows.map((row) => [
    row.paymentNumber,
    row.accountName,
    row.amount,
    row.currency,
    row.paymentMethod,
    formatDateTimeLocal(row.paidAt),
    row.status,
    row.orderNumber ?? "",
    row.customerName ?? "",
  ]);

  return {
    filename: csvFilename("payments-report", preset),
    content: rowsToCsv(headers, data),
  };
}

export async function exportInventoryReportCsv(
  _query: InventoryReportQueryDTO,
  client: DbTransaction,
): Promise<CsvExportResult> {
  const rows = await client
    .select({
      chassisNumber: vehicles.chassisNumber,
      brandName: brands.name,
      modelName: models.name,
      colorName: colors.name,
      vehicleType: models.vehicleType,
      status: vehicles.status,
      costPrice: vehicles.costPrice,
      costCurrency: vehicles.costCurrency,
      listPrice: vehicles.listPrice,
      listCurrency: vehicles.listCurrency,
      registrationReady: vehicles.registrationReady,
    })
    .from(vehicles)
    .innerJoin(models, eq(models.id, vehicles.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .innerJoin(colors, eq(colors.id, vehicles.colorId))
    .where(ne(vehicles.status, "written_off"))
    .orderBy(desc(vehicles.createdAt))
    .limit(EXPORT_ROW_LIMIT);

  const headers = [
    "chassisNumber",
    "brand",
    "model",
    "color",
    "vehicleType",
    "status",
    "costPrice",
    "costCurrency",
    "listPrice",
    "listCurrency",
    "registrationReady",
  ];

  const data = rows.map((row) => [
    row.chassisNumber ?? "",
    row.brandName,
    row.modelName,
    row.colorName,
    row.vehicleType,
    row.status,
    row.costPrice,
    row.costCurrency,
    row.listPrice,
    row.listCurrency,
    row.registrationReady ? "yes" : "no",
  ]);

  return {
    filename: csvFilename("inventory-snapshot"),
    content: rowsToCsv(headers, data),
  };
}
