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
import type { InventoryReportDTO } from "@/modules/reports/domain/contracts";
import { VEHICLE_STATUS_LABELS } from "@/modules/inventory/presentation/lib/labels";

const chartConfig = {
  count: { label: "ຈຳນວນ", color: "var(--chart-1)" },
} satisfies ChartConfig;

type InventoryStatusChartProps = {
  data?: InventoryReportDTO;
  isLoading?: boolean;
};

const STATUS_ORDER = [
  "in_stock",
  "reserved",
  "sold",
  "in_service",
] as const;

export function InventoryStatusChart({
  data,
  isLoading,
}: InventoryStatusChartProps) {
  const chartData =
    data?.byStatus
      .filter((row) => row.status !== "written_off")
      .sort(
        (a, b) =>
          STATUS_ORDER.indexOf(a.status as (typeof STATUS_ORDER)[number]) -
          STATUS_ORDER.indexOf(b.status as (typeof STATUS_ORDER)[number]),
      )
      .map((row) => ({
        status: row.status,
        label:
          VEHICLE_STATUS_LABELS[
            row.status as keyof typeof VEHICLE_STATUS_LABELS
          ] ?? row.status,
        count: row.count,
      })) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>ສະຖານະສຕັອກ</CardTitle>
        <CardDescription>ຈຳນວນລົດແຍກຕາມສະຖານະ</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : chartData.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground text-sm">
            ຍັງບໍ່ມີຂໍ້ມູນສຕັອກ
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
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
                width={90}
                tickMargin={8}
              />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
