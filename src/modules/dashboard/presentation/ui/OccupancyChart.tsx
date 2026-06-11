import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/kit";
import { occupancyData } from "../data/mock";

const chartConfig = {
  occupied: { label: "ເຂົ້າພັກ (%)", color: "var(--chart-1)" },
  available: { label: "ຫວ່າງ (%)", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function OccupancyChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ອັດຕາການເຂົ້າພັກ</CardTitle>
        <CardDescription>ລາຍອາທິດນີ້</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <BarChart data={occupancyData} margin={{ top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="occupied"
              stackId="a"
              fill="var(--color-occupied)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="available"
              stackId="a"
              fill="var(--color-available)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
