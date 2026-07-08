import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/kit";
import type { SalesReportDTO } from "@/modules/reports/domain/contracts";
import {
  formatCurrencyAmount,
  PAYMENT_TYPE_LABELS,
  SALES_STATUS_LABELS,
  type SaleCurrency,
  type SalePaymentType,
  type SalesOrderStatus,
} from "@/modules/sales/presentation/lib/labels";

type SalesReportSummaryProps = {
  summary?: SalesReportDTO["summary"];
  isLoading?: boolean;
};

export function SalesReportSummary({
  summary,
  isLoading,
}: SalesReportSummaryProps) {
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

  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>ຕາມສະຖານະ</CardDescription>
          <CardTitle className="font-semibold text-2xl tabular-nums">
            {summary.totalOrders}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          {summary.byStatus.length === 0 ? (
            <span className="text-muted-foreground">ບໍ່ມີຂໍ້ມູນ</span>
          ) : (
            summary.byStatus.map((row) => (
              <div
                key={row.status}
                className="flex items-center justify-between"
              >
                <span>
                  {SALES_STATUS_LABELS[row.status as SalesOrderStatus]}
                </span>
                <span className="font-medium tabular-nums">{row.count}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>ຕາມປະເພດຊຳລະ</CardDescription>
          <CardTitle className="font-semibold text-2xl tabular-nums">
            {summary.byPaymentType.reduce((sum, row) => sum + row.count, 0)}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          {summary.byPaymentType.length === 0 ? (
            <span className="text-muted-foreground">ບໍ່ມີຂໍ້ມູນ</span>
          ) : (
            summary.byPaymentType.map((row) => (
              <div
                key={row.paymentType}
                className="flex items-center justify-between"
              >
                <span>
                  {PAYMENT_TYPE_LABELS[row.paymentType as SalePaymentType]}
                </span>
                <span className="font-medium tabular-nums">{row.count}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>ຍອດຂາຍຢືນຢັນ/ສຳເລັດ (ແຍກສະກຸນ)</CardDescription>
          <CardTitle className="font-semibold text-lg">
            {summary.byCurrency.length === 0
              ? "—"
              : summary.byCurrency
                  .map((row) =>
                    formatCurrencyAmount(
                      row.totalAmount,
                      row.currency as SaleCurrency,
                    ),
                  )
                  .join(" · ")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          {summary.byCurrency.length === 0 ? (
            <span className="text-muted-foreground">ບໍ່ມີຍອດຂາຍໃນໄລຍະ</span>
          ) : (
            summary.byCurrency.map((row) => (
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
    </div>
  );
}
