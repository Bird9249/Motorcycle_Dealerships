import { useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button } from "@/components/kit";
import type { AfterSalesReportQueryDTO } from "@/modules/reports/domain/contracts";
import { useAfterSalesReportQuery } from "../api/queries";
import {
  AfterSalesReportSummary,
  ExpiringWarrantiesList,
} from "../ui/AfterSalesReportSummary";
import { ReportDateRangeFilter } from "../ui/ReportDateRangeFilter";

export function AfterSalesReportPage() {
  const nav = useNavigate({ from: "/app/reports/after-sales" });
  const search = useSearch({
    from: "/app/reports/after-sales",
  }) as AfterSalesReportQueryDTO & {
    period?: "day" | "week" | "month" | "custom";
  };

  const report = useAfterSalesReportQuery({
    period: search.period ?? "month",
    dateFrom: search.dateFrom,
    dateTo: search.dateTo,
    expiringDays: search.expiringDays,
    expiringLimit: search.expiringLimit,
  });

  return (
    <>
      <Header />
      <Main>
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2"
            onClick={() => nav({ to: "/app/reports" })}
          >
            <ArrowLeft className="size-4" />
            ກັບໄປລາຍງານ
          </Button>
          <h1 className="font-bold text-2xl tracking-tight">
            ລາຍງານຫຼັງການຂາຍ
          </h1>
          <p className="text-muted-foreground">
            ປະກັນໃກ້ໝົດອາຍຸ ແລະ ບໍລິການ check-in
          </p>
        </div>

        <div className="mb-4">
          <ReportDateRangeFilter
            value={{
              period: search.period ?? "month",
              dateFrom: search.dateFrom,
              dateTo: search.dateTo,
            }}
            onChange={(value) =>
              nav({
                search: {
                  ...search,
                  period: value.period,
                  dateFrom: value.dateFrom,
                  dateTo: value.dateTo,
                },
              })
            }
          />
        </div>

        <div className="mb-4">
          <AfterSalesReportSummary
            data={report.data}
            isLoading={report.isLoading}
          />
        </div>

        <ExpiringWarrantiesList
          data={report.data}
          isLoading={report.isLoading}
        />
      </Main>
    </>
  );
}
