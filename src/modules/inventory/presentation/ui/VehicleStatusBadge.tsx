import { Badge, cn } from "@/components/kit";
import type { VehicleStatus } from "../lib/labels";
import { VEHICLE_STATUS_LABELS } from "../lib/labels";

const STATUS_STYLES: Record<VehicleStatus, string> = {
  in_stock:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  reserved:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  sold: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  in_service:
    "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  written_off:
    "border-destructive/30 bg-destructive/10 text-destructive",
};

const STATUS_DOT: Record<VehicleStatus, string> = {
  in_stock: "bg-emerald-500",
  reserved: "bg-amber-500",
  sold: "bg-sky-500",
  in_service: "bg-violet-500",
  written_off: "bg-destructive",
};

type VehicleStatusBadgeProps = {
  status: VehicleStatus;
};

export function VehicleStatusBadge({ status }: VehicleStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium", STATUS_STYLES[status])}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[status])}
        aria-hidden
      />
      {VEHICLE_STATUS_LABELS[status]}
    </Badge>
  );
}
