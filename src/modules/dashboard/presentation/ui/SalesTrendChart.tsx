import { format, parseISO } from "date-fns";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
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
import type { DashboardKpisDTO } from "@/modules/reports/domain/contracts";
import {
  formatCurrencyAmount,
  type SaleCurrency,
} from "@/modules/sales/presentation/lib/labels";

const chartConfig = {
  count: { label: "ຈຳນວນຂາຍ", color: "var(--chart-1)" },
} satisfies ChartConfig;

type SalesTrendChartProps = {
  data?: DashboardKpisDTO;
  isLoading?: boolean;
};

function formatDayLabel(date: string) {
  return format(parseISO(date), "dd/MM");
}

export function SalesTrendChart({ data, isLoading }: SalesTrendChartProps) {
  const chartData =
    data?.trends.salesByDay.map((row) => ({
      date: row.date,
      label: formatDayLabel(row.date),
      count: row.count,
      amountByCurrency: row.amountByCurrency,
    })) ?? [];

  const periodLabel =
    data?.period.preset === "day"
      ? "ມື້ນີ້"
      : data?.period.preset === "week"
        ? "7 ວັນລ່າສຸດ"
        : "ເດືອນນີ້";

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>ແນວໂນ້ມການຂາຍ</CardTitle>
        <CardDescription>{periodLabel}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : chartData.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground text-sm">
            ຍັງບໍ່ມີຂໍ້ມູນການຂາຍໃນໄລຍະນີ້
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <AreaChart
              data={chartData}
              margin={{ left: 8, right: 8, top: 8 }}
            >
              <defs>
                <linearGradient id="fillSalesCount" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-count)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-count)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, item) => {
                      const payload = item.payload as {
                        count: number;
                        amountByCurrency: Record<string, string>;
                      };
                      const amounts = Object.entries(
                        payload.amountByCurrency ?? {},
                      )
                        .map(([currency, amount]) =>
                          formatCurrencyAmount(
                            amount,
                            currency as SaleCurrency,
                          ),
                        )
                        .join(" · ");
                      return (
                        <span className="font-medium tabular-nums">
                          {value} ຄັນ
                          {amounts ? ` · ${amounts}` : ""}
                        </span>
                      );
                    }}
                  />
                }
              />
              <Area
                dataKey="count"
                type="natural"
                fill="url(#fillSalesCount)"
                stroke="var(--color-count)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
