import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Skeleton,
} from "@/components/kit";
import type { DashboardKpisDTO } from "@/modules/reports/domain/contracts";
import { VEHICLE_STATUS_LABELS } from "@/modules/inventory/presentation/lib/labels";

type InventoryStatusSummaryProps = {
  data?: DashboardKpisDTO;
  isLoading?: boolean;
};

const STATUS_KEYS = ["in_stock", "reserved", "sold"] as const;

export function InventoryStatusSummary({
  data,
  isLoading,
}: InventoryStatusSummaryProps) {
  const inventory = data?.inventory;
  const total = inventory
    ? inventory.inStock + inventory.reserved + inventory.sold
    : 0;

  const rows = STATUS_KEYS.map((key) => {
    const count =
      key === "in_stock"
        ? (inventory?.inStock ?? 0)
        : key === "reserved"
          ? (inventory?.reserved ?? 0)
          : (inventory?.sold ?? 0);
    return {
      key,
      label: VEHICLE_STATUS_LABELS[key],
      count,
      total: total || 1,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>ສະຫຼຸບສະຖານະສຕັອກ</CardTitle>
        <CardDescription>
          {inventory
            ? `ICE ${inventory.iceCount} · EV ${inventory.evCount}`
            : "ຕາມສະຖານະລົດ"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))
        ) : total === 0 ? (
          <p className="text-center text-muted-foreground text-sm">
            ຍັງບໍ່ມີລົດໃນສຕັອກ
          </p>
        ) : (
          rows.map((row) => {
            const pct = Math.round((row.count / row.total) * 100);
            return (
              <div key={row.key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{row.label}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {row.count}/{row.total} ({pct}%)
                  </span>
                </div>
                <Progress value={pct} />
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
