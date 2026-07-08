import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/kit";
import type { InventoryReportDTO } from "@/modules/reports/domain/contracts";
import { VEHICLE_TYPE_LABELS } from "@/modules/inventory/presentation/lib/labels";
import {
  formatCurrencyAmount,
  type SaleCurrency,
} from "@/modules/sales/presentation/lib/labels";

type InventoryReportSummaryProps = {
  data?: InventoryReportDTO;
  isLoading?: boolean;
};

export function InventoryReportSummary({
  data,
  isLoading,
}: InventoryReportSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <CardDescription className="h-4 w-24 animate-pulse rounded bg-muted" />
              <CardTitle className="h-8 w-16 animate-pulse rounded bg-muted" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const iceCount =
    data.byVehicleType.find((row) => row.vehicleType === "ice")?.count ?? 0;
  const evCount =
    data.byVehicleType.find((row) => row.vehicleType === "ev")?.count ?? 0;

  const costSummary =
    data.costValueByCurrency.length === 0
      ? "—"
      : data.costValueByCurrency
          .map((row) =>
            formatCurrencyAmount(
              row.totalAmount,
              row.currency as SaleCurrency,
            ),
          )
          .join(" · ");

  const listSummary =
    data.listValueByCurrency.length === 0
      ? "—"
      : data.listValueByCurrency
          .map((row) =>
            formatCurrencyAmount(
              row.totalAmount,
              row.currency as SaleCurrency,
            ),
          )
          .join(" · ");

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>ລົດທັງໝົດ (ບໍ່ລວມຍົກເລີກ)</CardDescription>
          <CardTitle className="font-semibold text-2xl tabular-nums">
            {data.totalVehicles}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {VEHICLE_TYPE_LABELS.ice} {iceCount} · {VEHICLE_TYPE_LABELS.ev}{" "}
          {evCount}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>ມູນຄ່າຕົ້ນທຶນ (ແຍກສະກຸນ)</CardDescription>
          <CardTitle className="font-semibold text-lg">{costSummary}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          {data.costValueByCurrency.map((row) => (
            <div
              key={`cost-${row.currency}`}
              className="flex items-center justify-between"
            >
              <span>{row.currency}</span>
              <span className="font-medium tabular-nums">
                {formatCurrencyAmount(
                  row.totalAmount,
                  row.currency as SaleCurrency,
                )}{" "}
                ({row.count})
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>ມູນຄ່າລາຄາຂາຍ (ແຍກສະກຸນ)</CardDescription>
          <CardTitle className="font-semibold text-lg">{listSummary}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          {data.listValueByCurrency.map((row) => (
            <div
              key={`list-${row.currency}`}
              className="flex items-center justify-between"
            >
              <span>{row.currency}</span>
              <span className="font-medium tabular-nums">
                {formatCurrencyAmount(
                  row.totalAmount,
                  row.currency as SaleCurrency,
                )}{" "}
                ({row.count})
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
