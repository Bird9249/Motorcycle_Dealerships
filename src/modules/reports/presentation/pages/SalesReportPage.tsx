import { useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button } from "@/components/kit";
import type { SalesReportQueryDTO } from "@/modules/reports/domain/contracts";
import { useSalesReportQuery } from "../api/queries";
import { ExportCsvButton } from "../ui/ExportCsvButton";
import { ReportDateRangeFilter } from "../ui/ReportDateRangeFilter";
import { SalesReportSummary } from "../ui/SalesReportSummary";
import { SalesReportTable } from "../ui/SalesReportTable";

export function SalesReportPage() {
  const nav = useNavigate({ from: "/app/reports/sales" });
  const search = useSearch({
    from: "/app/reports/sales",
  }) as SalesReportQueryDTO & { period?: "day" | "week" | "month" | "custom" };

  const report = useSalesReportQuery({
    offset: search.offset,
    limit: search.limit,
    sort: search.sort,
    period: search.period ?? "month",
    dateFrom: search.dateFrom,
    dateTo: search.dateTo,
  });

  return (
    <>
      <Header />
      <Main>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
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
              ລາຍງານການຂາຍ
            </h1>
            <p className="text-muted-foreground">
              ສະຫຼຸບຄຳສັ່ງຂາຍໃນໄລຍະທີ່ເລືອກ
            </p>
          </div>
          <ExportCsvButton
            path="/reports/sales/export"
            query={{
              period: search.period ?? "month",
              dateFrom: search.dateFrom,
              dateTo: search.dateTo,
            }}
          />
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
                  offset: 0,
                  period: value.period,
                  dateFrom: value.dateFrom,
                  dateTo: value.dateTo,
                },
              })
            }
          />
        </div>

        <div className="mb-4">
          <SalesReportSummary
            summary={report.data?.summary}
            isLoading={report.isLoading}
          />
        </div>

        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <SalesReportTable
            data={report.data?.data ?? []}
            isLoading={report.isLoading}
            offset={Number(search.offset ?? 0)}
            limit={Number(search.limit ?? 20)}
            totalCount={report.data?.meta.total ?? 0}
            onPaginationChange={(offset, limit) =>
              nav({ search: { ...search, offset, limit } })
            }
            sortBy={search.sort ? search.sort[0]?.field : undefined}
            sortOrder={
              search.sort ? (search.sort[0]?.dir as "asc" | "desc") : undefined
            }
            onSortingChange={(id, desc) =>
              nav({
                search: {
                  ...search,
                  sort: [{ field: id, dir: desc ? "desc" : "asc" }],
                },
              })
            }
            onView={(order) =>
              nav({ to: "/app/sales/$id", params: { id: order.id } })
            }
          />
        </div>
      </Main>
    </>
  );
}
