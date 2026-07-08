import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Skeleton,
} from "@/components/kit";
import type { PaymentsReportDTO } from "@/modules/reports/domain/contracts";
import {
  formatCurrencyAmount,
  type SaleCurrency,
} from "@/modules/sales/presentation/lib/labels";

const chartConfig = {
  total: { label: "ຍອດຮັບ", color: "var(--chart-2)" },
} satisfies ChartConfig;

type PaymentByAccountChartProps = {
  data?: PaymentsReportDTO;
  isLoading?: boolean;
};

export function PaymentByAccountChart({
  data,
  isLoading,
}: PaymentByAccountChartProps) {
  const chartData =
    data?.verifiedByAccount.map((row) => ({
      accountId: row.accountId,
      label: row.name,
      total: Number.parseFloat(row.total) || 0,
      displayTotal: formatCurrencyAmount(
        row.total,
        row.currency as SaleCurrency,
      ),
      count: row.count,
    })) ?? [];

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>ຍອດຮັບແຍກບັນຊີ</CardTitle>
        <CardDescription>ການຊຳລະ verified ໃນໄລຍະທີ່ເລືອກ</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : chartData.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground text-sm">
            ບໍ່ມີການຊຳລະ verified ໃນໄລຍະນີ້
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="label"
                type="category"
                tickLine={false}
                axisLine={false}
                width={120}
                tickMargin={8}
              />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(_value, _name, item) => {
                      const payload = item.payload as {
                        displayTotal: string;
                        count: number;
                      };
                      return (
                        <span className="font-medium">
                          {payload.displayTotal} ({payload.count} ລາຍການ)
                        </span>
                      );
                    }}
                  />
                }
              />
              <Bar
                dataKey="total"
                fill="var(--color-total)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
