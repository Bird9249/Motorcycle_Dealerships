import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  cn,
} from "@/components/kit";
import { formatDateLocal } from "@/shared/lib/date-time";
import { useNavigate } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  BatteryChargingIcon,
  BikeIcon,
  CogIcon,
} from "lucide-react";
import type { WarrantyListItem } from "../api/client";
import {
  WARRANTY_STATUS_LABELS,
  WARRANTY_TYPE_LABELS,
  warrantyExpiryTone,
  type WarrantyType,
} from "../lib/labels";

const TYPE_ICONS: Record<WarrantyType, LucideIcon> = {
  vehicle: BikeIcon,
  motor: CogIcon,
  battery: BatteryChargingIcon,
};

const TYPE_ACCENT: Record<WarrantyType, string> = {
  vehicle: "border-l-primary",
  motor: "border-l-amber-500",
  battery: "border-l-emerald-500",
};

type WarrantyCardProps = {
  warranty: WarrantyListItem;
  className?: string;
};

export function WarrantyCard({ warranty, className }: WarrantyCardProps) {
  const nav = useNavigate();
  const Icon = TYPE_ICONS[warranty.warrantyType];
  const expiry = warrantyExpiryTone(warranty.daysRemaining);
  const statusLabel = WARRANTY_STATUS_LABELS[warranty.status];

  return (
    <Card
      className={cn(
        " cursor-pointer border-l-4 transition-colors hover:bg-muted/20",
        TYPE_ACCENT[warranty.warrantyType],
        className,
      )}
      onClick={() =>
        nav({
          to: "/app/after-sales/warranties/$id",
          params: { id: warranty.id },
        })
      }
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-muted p-2">
              <Icon className="size-4" />
            </div>
            <div>
              <p className="font-medium text-sm leading-none">
                {WARRANTY_TYPE_LABELS[warranty.warrantyType]}
              </p>
              <p className="mt-1 text-muted-foreground text-xs">
                {warranty.salesOrder.orderNumber}
              </p>
            </div>
          </div>
          <Badge variant={expiry.variant}>{expiry.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="font-medium">{warranty.customer.fullName}</p>
        <p className="text-muted-foreground text-xs">
          {warranty.vehicle.brandName} {warranty.vehicle.modelName}
          {warranty.vehicle.chassisNumber
            ? ` · ${warranty.vehicle.chassisNumber}`
            : ""}
        </p>
        {warranty.batterySerialNumber ? (
          <p className="text-muted-foreground text-xs">
            SN: {warranty.batterySerialNumber}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="outline">{statusLabel}</Badge>
          <span className="text-muted-foreground text-xs">
            {formatDateLocal(warranty.startDate)} →{" "}
            {formatDateLocal(warranty.endDate)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
