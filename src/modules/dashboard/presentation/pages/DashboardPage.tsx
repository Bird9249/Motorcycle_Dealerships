import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { useDashboardKpisQuery } from "@/modules/reports/presentation/api/queries";
import { DashboardReportDownload } from "../ui/DashboardReportDownload";
import { DealershipKpiCards } from "../ui/DealershipKpiCards";
import { InventoryStatusSummary } from "../ui/InventoryStatusSummary";
import { RecentSalesTable } from "../ui/RecentSalesTable";
import { SalesTrendChart } from "../ui/SalesTrendChart";
import { WarrantyExpiryAlert } from "../ui/WarrantyExpiryAlert";

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboardKpisQuery({ period: "month" });

  return (
    <>
      <Header />

      <Main>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-bold text-2xl tracking-tight">ແຜງຄວບຄຸມ</h1>
            <p className="text-muted-foreground">ພາບລວມຮ້ານຈຳໜ່າຍມໍເຕີ</p>
          </div>
          <DashboardReportDownload />
        </div>

        {isError ? (
          <p className="mb-4 text-destructive text-sm">
            ບໍ່ສາມາດໂຫຼດຂໍ້ມູນແຜງຄວບຄຸມໄດ້
          </p>
        ) : null}

        <div className="flex flex-col gap-4">
          <DealershipKpiCards data={data} isLoading={isLoading} />
          <WarrantyExpiryAlert />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SalesTrendChart data={data} isLoading={isLoading} />
            <InventoryStatusSummary data={data} isLoading={isLoading} />
          </div>

          <RecentSalesTable data={data} isLoading={isLoading} />
        </div>
      </Main>
    </>
  );
}
