import { Link } from "@tanstack/react-router";
import {
  Avatar,
  AvatarFallback,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/kit";
import type { DashboardKpisDTO } from "@/modules/reports/domain/contracts";
import {
  formatCurrencyAmount,
  type SaleCurrency,
} from "@/modules/sales/presentation/lib/labels";
import { SalesStatusBadge } from "@/modules/sales/presentation/ui/SalesStatusBadge";
import { formatDateLocal } from "@/shared/lib/date-time";
import { getInitials } from "@/shared/lib/utils";

type RecentSalesTableProps = {
  data?: DashboardKpisDTO;
  isLoading?: boolean;
};

export function RecentSalesTable({ data, isLoading }: RecentSalesTableProps) {
  const rows = data?.recentSales ?? [];

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>ການຂາຍລ່າສຸດ</CardTitle>
        <CardDescription>5 ລາຍການລ່າສຸດ</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col divide-y">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 py-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">
            ຍັງບໍ່ມີຄຳສັ່ງຂາຍ
          </p>
        ) : (
          rows.map((order) => {
            const displayDate = order.soldAt ?? order.createdAt;
            return (
              <Link
                key={order.id}
                to="/app/sales/$id"
                params={{ id: order.id }}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 transition-colors hover:bg-muted/40 -mx-2 px-2 rounded-md"
              >
                <Avatar className="size-9">
                  <AvatarFallback>
                    {getInitials(order.customerName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">
                    {order.customerName}
                  </p>
                  <p className="truncate text-muted-foreground text-xs">
                    {order.orderNumber} · {formatDateLocal(displayDate)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-medium text-sm tabular-nums">
                    {formatCurrencyAmount(
                      order.salePrice,
                      order.saleCurrency as SaleCurrency,
                    )}
                  </span>
                  <SalesStatusBadge status={order.status} />
                </div>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
