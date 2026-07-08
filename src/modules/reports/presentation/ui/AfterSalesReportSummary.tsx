import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/kit";
import type { AfterSalesReportDTO } from "@/modules/reports/domain/contracts";
import {
  SERVICE_TYPE_LABELS,
  warrantyExpiryTone,
  WARRANTY_TYPE_LABELS,
} from "@/modules/after-sales/presentation/lib/labels";
import type { ServiceType } from "@/modules/after-sales/domain/contracts";
import { formatDateLocal } from "@/shared/lib/date-time";

type AfterSalesReportSummaryProps = {
  data?: AfterSalesReportDTO;
  isLoading?: boolean;
};

export function AfterSalesReportSummary({
  data,
  isLoading,
}: AfterSalesReportSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <CardDescription className="h-4 w-24 animate-pulse rounded bg-muted" />
              <CardTitle className="h-8 w-16 animate-pulse rounded bg-muted" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>
            ປະກັນໃກ້ໝົດອາຍຸ ({data.expiringWarranties.days} ວັນ)
          </CardDescription>
          <CardTitle className="font-semibold text-2xl tabular-nums">
            {data.expiringWarranties.count}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Link
            to="/app/after-sales/warranties"
            search={{ expiringSoon: "true" }}
            className="text-primary text-sm hover:underline"
          >
            ເບິ່ງລາຍການປະກັນ
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>ບໍລິການ check-in ໃນໄລຍະ</CardDescription>
          <CardTitle className="font-semibold text-2xl tabular-nums">
            {data.serviceRecordsInPeriod}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          {data.serviceByType.length === 0 ? (
            <span className="text-muted-foreground">ບໍ່ມີຂໍ້ມູນ</span>
          ) : (
            data.serviceByType.map((row) => (
              <div
                key={row.serviceType}
                className="flex items-center justify-between"
              >
                <span>
                  {SERVICE_TYPE_LABELS[row.serviceType as ServiceType]}
                </span>
                <span className="font-medium tabular-nums">{row.count}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>ປະເພດບໍລິການທີ່ພົບຫຼາຍ</CardDescription>
          <CardTitle className="font-semibold text-2xl tabular-nums">
            {data.serviceByType[0]
              ? SERVICE_TYPE_LABELS[
                  data.serviceByType[0].serviceType as ServiceType
                ]
              : "—"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          ສະຫຼຸບຕາມ serviceType ໃນໄລຍະທີ່ເລືອກ
        </CardContent>
      </Card>
    </div>
  );
}

type ExpiringWarrantiesListProps = {
  data?: AfterSalesReportDTO;
  isLoading?: boolean;
};

export function ExpiringWarrantiesList({
  data,
  isLoading,
}: ExpiringWarrantiesListProps) {
  const items = data?.expiringWarranties.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>ປະກັນໃກ້ໝົດອາຍຸ</CardTitle>
        <CardDescription>
          {data
            ? `${items.length} ລາຍການ (ຈາກທັງໝົດ ${data.expiringWarranties.count})`
            : "ລາຍການລ່າສຸດ"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col divide-y">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">ກຳລັງໂຫຼດ...</p>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">
            ບໍ່ມີປະກັນໃກ້ໝົດອາຍຸ
          </p>
        ) : (
          items.map((item) => {
            const tone = warrantyExpiryTone(item.daysRemaining);
            return (
              <Link
                key={item.id}
                to="/app/after-sales/warranties/$id"
                params={{ id: item.id }}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 transition-colors hover:bg-muted/40 -mx-2 px-2 rounded-md"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">
                    {item.customer.fullName}
                  </p>
                  <p className="truncate text-muted-foreground text-xs">
                    {WARRANTY_TYPE_LABELS[item.warrantyType]} ·{" "}
                    {item.vehicle.brandName} {item.vehicle.modelName} ·{" "}
                    {formatDateLocal(item.endDate)}
                  </p>
                </div>
                <span className="shrink-0 text-muted-foreground text-xs">
                  {tone.label}
                </span>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
