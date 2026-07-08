import { useQuery } from "@tanstack/react-query";
import type {
  AfterSalesReportQueryDTO,
  DashboardQueryDTO,
  InventoryReportQueryDTO,
  PaymentsReportQueryDTO,
  SalesReportQueryDTO,
} from "@/modules/reports/domain/contracts";
import { reportsApi } from "./client";

export const reportsKeys = {
  all: ["reports"] as const,
  dashboard: (q: Partial<DashboardQueryDTO>) =>
    ["reports", "dashboard", q] as const,
  sales: (q: Partial<SalesReportQueryDTO>) => ["reports", "sales", q] as const,
  inventory: (q: Partial<InventoryReportQueryDTO>) =>
    ["reports", "inventory", q] as const,
  payments: (q: Partial<PaymentsReportQueryDTO>) =>
    ["reports", "payments", q] as const,
  afterSales: (q: Partial<AfterSalesReportQueryDTO>) =>
    ["reports", "after-sales", q] as const,
};

export function useDashboardKpisQuery(
  query: Partial<DashboardQueryDTO> = { period: "month" },
) {
  const q: Partial<DashboardQueryDTO> = {
    period: query.period ?? "month",
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  };
  return useQuery({
    queryKey: reportsKeys.dashboard(q),
    queryFn: () => reportsApi.getDashboard(q),
  });
}

export function useSalesReportQuery(
  query: Partial<SalesReportQueryDTO> & {
    period?: "day" | "week" | "month" | "custom";
  } = {},
) {
  const q: Partial<SalesReportQueryDTO> = {
    limit: query.limit ?? 20,
    offset: query.offset ?? 0,
    sort: query.sort,
    period: query.period ?? "month",
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  };
  return useQuery({
    queryKey: reportsKeys.sales(q),
    queryFn: () => reportsApi.getSalesReport(q),
  });
}

export function useInventoryReportQuery(
  query: Partial<InventoryReportQueryDTO> = {},
) {
  const q: Partial<InventoryReportQueryDTO> = {
    brandLimit: query.brandLimit ?? 10,
    dateTo: query.dateTo,
  };
  return useQuery({
    queryKey: reportsKeys.inventory(q),
    queryFn: () => reportsApi.getInventoryReport(q),
  });
}

export function usePaymentsReportQuery(
  query: Partial<PaymentsReportQueryDTO> & {
    period?: "day" | "week" | "month" | "custom";
  } = {},
) {
  const q: Partial<PaymentsReportQueryDTO> = {
    period: query.period ?? "month",
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  };
  return useQuery({
    queryKey: reportsKeys.payments(q),
    queryFn: () => reportsApi.getPaymentsReport(q),
  });
}

export function useAfterSalesReportQuery(
  query: Partial<AfterSalesReportQueryDTO> & {
    period?: "day" | "week" | "month" | "custom";
  } = {},
) {
  const q: Partial<AfterSalesReportQueryDTO> = {
    period: query.period ?? "month",
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    expiringDays: query.expiringDays ?? 30,
    expiringLimit: query.expiringLimit ?? 20,
  };
  return useQuery({
    queryKey: reportsKeys.afterSales(q),
    queryFn: () => reportsApi.getAfterSalesReport(q),
  });
}
