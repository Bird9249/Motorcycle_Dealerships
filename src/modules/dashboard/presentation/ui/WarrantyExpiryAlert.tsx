import { useNavigate } from "@tanstack/react-router";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import { formatDateLocal } from "@/shared/lib/date-time";
import { AlertTriangleIcon, ShieldCheckIcon } from "lucide-react";
import { useExpiringWarrantiesQuery } from "@/modules/after-sales/presentation/api/queries";
import {
  WARRANTY_TYPE_LABELS,
  warrantyExpiryTone,
} from "@/modules/after-sales/presentation/lib/labels";

export function WarrantyExpiryAlert() {
  const nav = useNavigate();
  const canRead = useActionPermission(["after-sales:read"]);
  const expiring = useExpiringWarrantiesQuery({ days: 30, limit: 5 });

  if (!canRead) return null;

  const items = expiring.data?.items ?? [];
  if (expiring.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheckIcon className="size-4" />
            ປະກັນໃກ້ໝົດອາຍຸ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">ກຳລັງໂຫຼດ...</p>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangleIcon className="size-4 text-amber-600 dark:text-amber-400" />
              ປະກັນໃກ້ໝົດອາຍຸ
            </CardTitle>
            <CardDescription className="mt-1">
              {items.length} ລາຍການໃນ 30 ວັນຂ້າງໜ້າ
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              nav({
                to: "/app/after-sales/warranties",
                search: { expiringSoon: "true", offset: 0, limit: 20 },
              })
            }
          >
            ເບິ່ງທັງໝົດ
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const tone = warrantyExpiryTone(item.daysRemaining);
          return (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-center justify-between gap-3 rounded-lg border bg-background/80 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40"
              onClick={() =>
                nav({
                  to: "/app/after-sales/warranties/$id",
                  params: { id: item.id },
                })
              }
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {WARRANTY_TYPE_LABELS[item.warrantyType]} ·{" "}
                  {item.customer.fullName}
                </p>
                <p className="truncate text-muted-foreground text-xs">
                  {item.salesOrder.orderNumber} ·{" "}
                  {formatDateLocal(item.endDate)}
                </p>
              </div>
              <Badge variant={tone.variant} className="shrink-0">
                {tone.label}
              </Badge>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
