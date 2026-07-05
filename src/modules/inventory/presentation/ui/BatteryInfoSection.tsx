import { BatteryChargingIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/kit";
import type { VehicleDetailResult } from "@/modules/inventory/domain/types";

type BatteryInfoSectionProps = {
  vehicle: VehicleDetailResult;
};

export function BatteryInfoSection({ vehicle }: BatteryInfoSectionProps) {
  if (vehicle.model.vehicleType !== "ev") return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <BatteryChargingIcon className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base">ຂໍ້ມູນແບັດເຕີຣີ (EV)</CardTitle>
            <CardDescription>ເລກແບັດ ແລະ ຄວາມຈຸພະລັງງານ</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-muted-foreground">ເລກແບັດ</div>
          <div className="col-span-2 font-mono text-xs">
            {vehicle.batterySerialNumber ?? "—"}
          </div>
          <div className="text-muted-foreground">ຄວາມຈຸ</div>
          <div className="col-span-2 tabular-nums">
            {vehicle.batteryCapacityKwh
              ? `${vehicle.batteryCapacityKwh} kWh`
              : vehicle.model.batteryCapacityKwh
                ? `${vehicle.model.batteryCapacityKwh} kWh (ລຸ່ນ)`
                : "—"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
