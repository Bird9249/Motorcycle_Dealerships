import { useEffect, useState } from "react";
import {
  confirm,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import type { VehicleStatus } from "../lib/labels";
import { useUpdateVehicleStatus } from "../api/queries";
import { VEHICLE_STATUS_LABELS, VEHICLE_STATUS_OPTIONS } from "../lib/labels";
import { VehicleStatusBadge } from "./VehicleStatusBadge";

type VehicleStatusChangeProps = {
  vehicleId: string;
  currentStatus: VehicleStatus;
};

export function VehicleStatusChange({
  vehicleId,
  currentStatus,
}: VehicleStatusChangeProps) {
  const canChangeStatus = useActionPermission(["inventory:update-status"]);
  const updateStatus = useUpdateVehicleStatus(vehicleId);
  const [value, setValue] = useState(currentStatus);

  useEffect(() => {
    setValue(currentStatus);
  }, [currentStatus]);

  if (!canChangeStatus) {
    return <VehicleStatusBadge status={currentStatus} />;
  }

  const handleChange = async (next: VehicleStatus) => {
    if (next === currentStatus) {
      setValue(currentStatus);
      return;
    }

    const ok = await confirm({
      title: "ປ່ຽນສະຖານະລົດ",
      description: `ປ່ຽນຈາກ "${VEHICLE_STATUS_LABELS[currentStatus]}" ເປັນ "${VEHICLE_STATUS_LABELS[next]}"?`,
      actionText: "ປ່ຽນສະຖານະ",
    });

    if (!ok) {
      setValue(currentStatus);
      return;
    }

    try {
      await updateStatus.mutateAsync({ status: next });
      toast.success("ປ່ຽນສະຖານະສຳເລັດ");
    } catch {
      setValue(currentStatus);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">ສະຖານະລົດ</Label>
      <Select
        value={value}
        disabled={updateStatus.isPending}
        onValueChange={(val) => {
          const next = val as VehicleStatus;
          setValue(next);
          void handleChange(next);
        }}
      >
        <SelectTrigger className="h-9 w-full min-w-[160px] sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {VEHICLE_STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
