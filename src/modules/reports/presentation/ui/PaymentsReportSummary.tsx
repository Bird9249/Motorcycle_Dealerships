import { Link } from "@tanstack/react-router";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/kit";
import type { PaymentsReportDTO } from "@/modules/reports/domain/contracts";
import {
  formatCurrencyAmount,
  type SaleCurrency,
} from "@/modules/sales/presentation/lib/labels";
import { formatDateForInput } from "@/shared/lib/date-time";

type PaymentsReportSummaryProps = {
  data?: PaymentsReportDTO;
  isLoading?: boolean;
};

export function PaymentsReportSummary({
  data,
  isLoading,
}: PaymentsReportSummaryProps) {
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

  const verifiedTotal = data.verifiedByCurrency.reduce(
    (sum, row) => sum + row.count,
    0,
  );

  const currencySummary =
    data.verifiedByCurrency.length === 0
      ? "—"
      : data.verifiedByCurrency
          .map((row) =>
            formatCurrencyAmount(
              row.totalAmount,
              row.currency as SaleCurrency,
            ),
          )
          .join(" · ");

  const reconcileDate = formatDateForInput(data.period.dateTo);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>ລໍຖ້າຢືນຢັນສລິບ</CardDescription>
          <CardTitle className="font-semibold text-2xl tabular-nums">
            {data.pendingCount}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/payments" search={{ status: "pending" }}>
              ເບິ່ງລາຍການ pending
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>ຮັບຊຳລະ verified</CardDescription>
          <CardTitle className="font-semibold text-lg">
            {currencySummary}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          {data.verifiedByCurrency.length === 0 ? (
            <span className="text-muted-foreground">ບໍ່ມີຂໍ້ມູນໃນໄລຍະ</span>
          ) : (
            data.verifiedByCurrency.map((row) => (
              <div
                key={row.currency}
                className="flex items-center justify-between"
              >
                <span>{row.currency}</span>
                <span className="font-medium tabular-nums">
                  {formatCurrencyAmount(
                    row.totalAmount,
                    row.currency as SaleCurrency,
                  )}{" "}
                  ({row.count})
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>ກວດສອບຍອດປະຈຳວັນ</CardDescription>
          <CardTitle className="font-semibold text-2xl tabular-nums">
            {verifiedTotal}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-muted-foreground text-sm">
            ລາຍການ verified ໃນໄລຍະ
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link
              to="/app/payments/reconciliation"
              search={{ date: reconcileDate }}
            >
              ໄປກວດສອບຍອດ
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
