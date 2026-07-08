import {
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

type DealershipKpiCardsProps = {
  data?: DashboardKpisDTO;
  isLoading?: boolean;
};

function formatSalesSummary(
  byCurrency: DashboardKpisDTO["sales"]["byCurrency"],
): string {
  if (byCurrency.length === 0) return "0";
  return byCurrency
    .map((row) =>
      formatCurrencyAmount(row.totalAmount, row.currency as SaleCurrency),
    )
    .join(" · ");
}

function formatVerifiedSummary(
  rows: DashboardKpisDTO["payments"]["verifiedInPeriodByCurrency"],
): string {
  if (rows.length === 0) return "0";
  return rows
    .map((row) =>
      formatCurrencyAmount(row.totalAmount, row.currency as SaleCurrency),
    )
    .join(" · ");
}

export function DealershipKpiCards({ data, isLoading }: DealershipKpiCardsProps) {
  const salesCount =
    (data?.sales.confirmedCount ?? 0) + (data?.sales.completedCount ?? 0);

  const cards = [
    {
      key: "stock",
      label: "ສຕັອກຄົງຄັງ",
      value: data ? String(data.inventory.inStock) : "—",
      hint: data
        ? `ຈອງ ${data.inventory.reserved} · ຂາຍ ${data.inventory.sold}`
        : "",
    },
    {
      key: "sales",
      label: "ຂາຍໃນໄລຍະ",
      value: isLoading ? "—" : String(salesCount),
      hint: data ? formatSalesSummary(data.sales.byCurrency) : "",
    },
    {
      key: "verified",
      label: "ຮັບຊຳລະຢືນຢັນແລ້ວ",
      value: isLoading
        ? "—"
        : formatVerifiedSummary(data?.payments.verifiedInPeriodByCurrency ?? []),
      hint: data
        ? `${data.payments.verifiedInPeriodByCurrency.reduce((sum, row) => sum + row.count, 0)} ລາຍການ`
        : "",
    },
    {
      key: "pending",
      label: "ລໍຖ້າຢືນຢັນສລິບ",
      value: data ? String(data.payments.pendingCount) : "—",
      hint: "ການຊຳລະທີ່ຍັງບໍ່ຢືນຢັນ",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.key}>
          <CardHeader>
            <CardDescription>{card.label}</CardDescription>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <CardTitle className="font-semibold text-2xl tabular-nums">
                {card.value}
              </CardTitle>
            )}
          </CardHeader>
          {card.hint ? (
            <CardContent className="text-muted-foreground text-sm">
              {isLoading ? <Skeleton className="h-4 w-32" /> : card.hint}
            </CardContent>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
