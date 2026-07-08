import { useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button } from "@/components/kit";
import type { PaymentsReportQueryDTO } from "@/modules/reports/domain/contracts";
import { usePaymentsReportQuery } from "../api/queries";
import { ReportDateRangeFilter } from "../ui/ReportDateRangeFilter";
import { ExportCsvButton } from "../ui/ExportCsvButton";
import { PaymentByAccountChart } from "../ui/PaymentByAccountChart";
import { PaymentsReportSummary } from "../ui/PaymentsReportSummary";

export function PaymentsReportPage() {
  const nav = useNavigate({ from: "/app/reports/payments" });
  const search = useSearch({
    from: "/app/reports/payments",
  }) as PaymentsReportQueryDTO & {
    period?: "day" | "week" | "month" | "custom";
  };

  const report = usePaymentsReportQuery({
    period: search.period ?? "month",
    dateFrom: search.dateFrom,
    dateTo: search.dateTo,
  });

  return (
    <>
      <Header />
      <Main>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
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
              ລາຍງານການເງິນ
            </h1>
            <p className="text-muted-foreground">
              ຍອດຮັບ verified ແຍກບັນຊີ ແລະ ສະຖານະ pending
            </p>
          </div>
          <ExportCsvButton
            path="/reports/payments/export"
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
                  period: value.period,
                  dateFrom: value.dateFrom,
                  dateTo: value.dateTo,
                },
              })
            }
          />
        </div>

        <div className="mb-4">
          <PaymentsReportSummary
            data={report.data}
            isLoading={report.isLoading}
          />
        </div>

        <PaymentByAccountChart data={report.data} isLoading={report.isLoading} />
      </Main>
    </>
  );
}
