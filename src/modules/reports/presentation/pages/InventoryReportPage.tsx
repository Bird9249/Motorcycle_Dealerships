import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button } from "@/components/kit";
import { formatDateLocal } from "@/shared/lib/date-time";
import { useInventoryReportQuery } from "../api/queries";
import { ExportCsvButton } from "../ui/ExportCsvButton";
import { InventoryReportSummary } from "../ui/InventoryReportSummary";
import { InventoryStatusChart } from "../ui/InventoryStatusChart";

export function InventoryReportPage() {
  const nav = useNavigate({ from: "/app/reports/inventory" });
  const report = useInventoryReportQuery();

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
            <h1 className="font-bold text-2xl tracking-tight">ລາຍງານສຕັອກ</h1>
            <p className="text-muted-foreground">
              Snapshot ສະຖານະລົດ ແລະ ມູນຄ່າສຕັອກ
              {report.data?.snapshotAt
                ? ` · ${formatDateLocal(report.data.snapshotAt)}`
                : ""}
            </p>
          </div>
          <ExportCsvButton path="/reports/inventory/export" />
        </div>

        <div className="mb-4">
          <InventoryReportSummary
            data={report.data}
            isLoading={report.isLoading}
          />
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <InventoryStatusChart
            data={report.data}
            isLoading={report.isLoading}
          />

          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="mb-3 font-medium text-sm">ແບຣນດ์ຍອດນິຍົມ</h3>
            {report.isLoading ? (
              <p className="text-muted-foreground text-sm">ກຳລັງໂຫຼດ...</p>
            ) : (report.data?.byBrand.length ?? 0) === 0 ? (
              <p className="text-muted-foreground text-sm">ບໍ່ມີຂໍ້ມູນ</p>
            ) : (
              <div className="flex flex-col divide-y">
                {report.data?.byBrand.map((row) => (
                  <div
                    key={row.brandId}
                    className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0"
                  >
                    <span className="font-medium">{row.brandName}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {row.count} ຄັນ
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Main>
    </>
  );
}
