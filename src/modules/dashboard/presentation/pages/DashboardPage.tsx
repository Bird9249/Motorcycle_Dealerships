import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import { useDashboardKpisQuery } from "@/modules/reports/presentation/api/queries";
import { DashboardQuickActions } from "../ui/DashboardQuickActions";
import { DashboardReportDownload } from "../ui/DashboardReportDownload";
import { DealershipKpiCards } from "../ui/DealershipKpiCards";
import { InventoryStatusSummary } from "../ui/InventoryStatusSummary";
import { RecentSalesTable } from "../ui/RecentSalesTable";
import { SalesTrendChart } from "../ui/SalesTrendChart";
import { WarrantyExpiryAlert } from "../ui/WarrantyExpiryAlert";

export function DashboardPage() {
  const canReadReports = useActionPermission(["reports:read"]);
  const { data, isLoading, isError } = useDashboardKpisQuery(
    { period: "month" },
    { enabled: canReadReports },
  );

  return (
    <>
      <Header />

      <Main>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-bold text-2xl tracking-tight">ແຜງຄວບຄຸມ</h1>
            <p className="text-muted-foreground">
              {canReadReports
                ? "ພາບລວມຮ້ານຈຳໜ່າຍມໍເຕີ"
                : "ເຂົ້າເຖິງໜ້າທີ່ທ່ານໃຊ້ງານໄດ້"}
            </p>
          </div>
          {canReadReports ? <DashboardReportDownload /> : null}
        </div>

        <div className="flex flex-col gap-4">
          <DashboardQuickActions />

          {canReadReports ? (
            <>
              {isError ? (
                <p className="text-destructive text-sm">
                  ບໍ່ສາມາດໂຫຼດຂໍ້ມູນແຜງຄວບຄຸມໄດ້
                </p>
              ) : null}

              <DealershipKpiCards data={data} isLoading={isLoading} />
              <WarrantyExpiryAlert />

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <SalesTrendChart data={data} isLoading={isLoading} />
                <InventoryStatusSummary data={data} isLoading={isLoading} />
              </div>

              <RecentSalesTable data={data} isLoading={isLoading} />
            </>
          ) : (
            <WarrantyExpiryAlert />
          )}
        </div>
      </Main>
    </>
  );
}
