import { Permissions } from "@/modules/roles/domain/contracts/permissions";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { Elysia } from "elysia";
import {
  AfterSalesReportQuerySchema,
  DashboardQuerySchema,
  InventoryReportQuerySchema,
  PaymentsReportQuerySchema,
  SalesReportQuerySchema,
} from "../contracts";
import { getAfterSalesReport } from "../repo/after-sales-summary";
import { getDashboardKpis } from "../repo/dashboard-kpis";
import {
  exportInventoryReportCsv,
  exportPaymentsReportCsv,
  exportSalesReportCsv,
} from "../repo/exports";
import { getInventoryReport } from "../repo/inventory-snapshot";
import { getPaymentsReport } from "../repo/payments-summary";
import { getSalesReport } from "../repo/sales-summary";
import { mapReportsError } from "./map-error";

function csvResponse(result: { filename: string; content: string }) {
  return new Response(result.content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
    },
  });
}

export const reportsRoutes = new Elysia()
  .use(serverContext)
  .get(
    "/dashboard",
    async ({ db, query, status }) => {
      try {
        return await getDashboardKpis(query, db);
      } catch (error) {
        return mapReportsError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.reports.read),
      query: DashboardQuerySchema,
    },
  )
  .get(
    "/sales",
    async ({ db, query, status }) => {
      try {
        return await getSalesReport(query, db);
      } catch (error) {
        return mapReportsError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.reports.read),
      query: SalesReportQuerySchema,
    },
  )
  .get(
    "/sales/export",
    async ({ db, query, status }) => {
      try {
        const result = await exportSalesReportCsv(query, db);
        return csvResponse(result);
      } catch (error) {
        return mapReportsError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.reports.export),
      query: SalesReportQuerySchema,
    },
  )
  .get(
    "/inventory",
    async ({ db, query, status }) => {
      try {
        return await getInventoryReport(query, db);
      } catch (error) {
        return mapReportsError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.reports.read),
      query: InventoryReportQuerySchema,
    },
  )
  .get(
    "/inventory/export",
    async ({ db, query, status }) => {
      try {
        const result = await exportInventoryReportCsv(query, db);
        return csvResponse(result);
      } catch (error) {
        return mapReportsError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.reports.export),
      query: InventoryReportQuerySchema,
    },
  )
  .get(
    "/payments",
    async ({ db, query, status }) => {
      try {
        return await getPaymentsReport(query, db);
      } catch (error) {
        return mapReportsError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.reports.read),
      query: PaymentsReportQuerySchema,
    },
  )
  .get(
    "/payments/export",
    async ({ db, query, status }) => {
      try {
        const result = await exportPaymentsReportCsv(query, db);
        return csvResponse(result);
      } catch (error) {
        return mapReportsError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.reports.export),
      query: PaymentsReportQuerySchema,
    },
  )
  .get(
    "/after-sales",
    async ({ db, query, status }) => {
      try {
        return await getAfterSalesReport(query, db);
      } catch (error) {
        return mapReportsError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.reports.read),
      query: AfterSalesReportQuerySchema,
    },
  );
