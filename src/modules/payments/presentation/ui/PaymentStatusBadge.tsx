import { Badge } from "@/components/kit";
import type { PaymentListItem } from "../api/client";
import { PAYMENT_STATUS_LABELS, type PaymentStatus } from "../lib/labels";

const VARIANTS: Record<
  PaymentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  verified: "default",
  rejected: "destructive",
};

export function PaymentStatusBadge({
  status,
}: {
  status: PaymentListItem["status"];
}) {
  return (
    <Badge variant={VARIANTS[status]}>{PAYMENT_STATUS_LABELS[status]}</Badge>
  );
}
