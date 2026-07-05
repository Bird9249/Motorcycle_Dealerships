import { ArrowRightIcon, HistoryIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/kit";
import { formatDateTimeLocal } from "@/shared/lib/date-time";
import { useVehicleStatusHistoryQuery } from "../api/queries";
import { VEHICLE_STATUS_LABELS, type VehicleStatus } from "../lib/labels";
import { VehicleStatusBadge } from "./VehicleStatusBadge";

type VehicleStatusTimelineProps = {
  vehicleId: string;
};

function StatusTransition({
  fromStatus,
  toStatus,
}: {
  fromStatus: VehicleStatus | null;
  toStatus: VehicleStatus;
}) {
  if (!fromStatus) {
    return <VehicleStatusBadge status={toStatus} />;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <VehicleStatusBadge status={fromStatus} />
      <ArrowRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
      <VehicleStatusBadge status={toStatus} />
    </div>
  );
}

export function VehicleStatusTimeline({ vehicleId }: VehicleStatusTimelineProps) {
  const history = useVehicleStatusHistoryQuery(vehicleId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HistoryIcon className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base">ປະຫວັດສະຖານະ</CardTitle>
            <CardDescription>
              ການປ່ຽນສະຖານະລົດຈາກບັນທຶກການກວດກາ
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {history.isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : null}

        {!history.isLoading && (history.data?.length ?? 0) === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
            ຍັງບໍ່ມີປະຫວັດການປ່ຽນສະຖານະ
          </p>
        ) : null}

        {!history.isLoading && (history.data?.length ?? 0) > 0 ? (
          <ol className="relative space-y-0 border-muted border-l pl-6">
            {history.data?.map((item, index) => (
              <li key={item.id} className="relative pb-6 last:pb-0">
                <span
                  className="absolute top-1.5 -left-[calc(0.75rem+1px)] size-2.5 rounded-full border-2 border-background bg-primary"
                  aria-hidden
                />
                <div className="space-y-2">
                  <StatusTransition
                    fromStatus={item.fromStatus}
                    toStatus={item.toStatus}
                  />
                  <p className="text-muted-foreground text-xs">
                    {formatDateTimeLocal(item.occurredAt)}
                    {item.action === "INVENTORY.VEHICLE.CREATE"
                      ? " · ສ້າງລົດ"
                      : null}
                    {item.actorRole ? ` · ${item.actorRole}` : null}
                  </p>
                  {index === 0 ? (
                    <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase tracking-wide">
                      ລ່າສຸດ
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        ) : null}
      </CardContent>
    </Card>
  );
}
