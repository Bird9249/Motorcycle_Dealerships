import { cn } from "@/lib/utils";
import { Badge } from "@/components/kit";
import {
  PAYMENT_TYPE_LABELS,
  SALES_STATUS_LABELS,
  type SalePaymentType,
  type SalesOrderStatus,
} from "../lib/labels";

export function SalesStatusBadge({ status }: { status: SalesOrderStatus }) {
  const variant =
    status === "confirmed" || status === "completed"
      ? "default"
      : status === "draft"
        ? "secondary"
        : "outline";

  return (
    <Badge
      variant={variant}
      className={cn(
        status === "cancelled" && "text-muted-foreground",
        status === "confirmed" && "bg-emerald-600 hover:bg-emerald-600",
      )}
    >
      {SALES_STATUS_LABELS[status]}
    </Badge>
  );
}

export function PaymentTypeBadge({ type }: { type: SalePaymentType }) {
  return (
    <Badge variant="outline" className="font-normal">
      {PAYMENT_TYPE_LABELS[type]}
    </Badge>
  );
}
