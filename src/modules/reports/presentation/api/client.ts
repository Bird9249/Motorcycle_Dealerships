import type {
  AfterSalesReportDTO,
  AfterSalesReportQueryDTO,
  DashboardKpisDTO,
  DashboardQueryDTO,
  InventoryReportDTO,
  InventoryReportQueryDTO,
  PaymentsReportDTO,
  PaymentsReportQueryDTO,
  SalesReportDTO,
  SalesReportQueryDTO,
} from "@/modules/reports/domain/contracts";
import { config } from "@/shared/lib/config";
import { fetcher } from "@/shared/lib/fetcher";

function buildDashboardUrl(query: Partial<DashboardQueryDTO> = {}) {
  const url = new URL(`${config.apiUrl}/reports/dashboard`);
  if (query.period) url.searchParams.set("period", query.period);
  if (query.dateFrom) url.searchParams.set("dateFrom", query.dateFrom);
  if (query.dateTo) url.searchParams.set("dateTo", query.dateTo);
  return url.toString();
}

function buildSalesReportUrl(query: Partial<SalesReportQueryDTO> = {}) {
  const url = new URL(`${config.apiUrl}/reports/sales`);
  url.searchParams.set("limit", String(query.limit ?? 20));
  url.searchParams.set("offset", String(query.offset ?? 0));
  if (query.period) url.searchParams.set("period", query.period);
  if (query.dateFrom) url.searchParams.set("dateFrom", query.dateFrom);
  if (query.dateTo) url.searchParams.set("dateTo", query.dateTo);
  if (query.sort?.length) {
    url.searchParams.set("sort", JSON.stringify(query.sort));
  }
  return url.toString();
}

function buildInventoryReportUrl(query: Partial<InventoryReportQueryDTO> = {}) {
  const url = new URL(`${config.apiUrl}/reports/inventory`);
  url.searchParams.set("brandLimit", String(query.brandLimit ?? 10));
  if (query.dateTo) url.searchParams.set("dateTo", query.dateTo);
  return url.toString();
}

function buildPaymentsReportUrl(query: Partial<PaymentsReportQueryDTO> = {}) {
  const url = new URL(`${config.apiUrl}/reports/payments`);
  if (query.period) url.searchParams.set("period", query.period);
  if (query.dateFrom) url.searchParams.set("dateFrom", query.dateFrom);
  if (query.dateTo) url.searchParams.set("dateTo", query.dateTo);
  return url.toString();
}

function buildAfterSalesReportUrl(
  query: Partial<AfterSalesReportQueryDTO> = {},
) {
  const url = new URL(`${config.apiUrl}/reports/after-sales`);
  if (query.period) url.searchParams.set("period", query.period);
  if (query.dateFrom) url.searchParams.set("dateFrom", query.dateFrom);
  if (query.dateTo) url.searchParams.set("dateTo", query.dateTo);
  if (query.expiringDays != null) {
    url.searchParams.set("expiringDays", String(query.expiringDays));
  }
  if (query.expiringLimit != null) {
    url.searchParams.set("expiringLimit", String(query.expiringLimit));
  }
  return url.toString();
}

export type DashboardKpis = DashboardKpisDTO;
export type SalesReport = SalesReportDTO;
export type InventoryReport = InventoryReportDTO;
export type PaymentsReport = PaymentsReportDTO;
export type AfterSalesReport = AfterSalesReportDTO;

export const reportsApi = {
  getDashboard(query: Partial<DashboardQueryDTO> = {}) {
    return fetcher.get<DashboardKpis>(buildDashboardUrl(query));
  },

  getSalesReport(query: Partial<SalesReportQueryDTO> = {}) {
    return fetcher.get<SalesReport>(
      buildSalesReportUrl({
        limit: query.limit ?? 20,
        offset: query.offset ?? 0,
        period: query.period,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        sort: query.sort,
      }),
    );
  },

  getInventoryReport(query: Partial<InventoryReportQueryDTO> = {}) {
    return fetcher.get<InventoryReport>(buildInventoryReportUrl(query));
  },

  getPaymentsReport(query: Partial<PaymentsReportQueryDTO> = {}) {
    return fetcher.get<PaymentsReport>(buildPaymentsReportUrl(query));
  },

  getAfterSalesReport(query: Partial<AfterSalesReportQueryDTO> = {}) {
    return fetcher.get<AfterSalesReport>(buildAfterSalesReportUrl(query));
  },
};
