import { TrendingDown, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from "@/components/kit";
import { stats } from "../data/mock";

export function StatCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const positive = stat.delta >= 0;
        const Icon = positive ? TrendingUp : TrendingDown;
        return (
          <Card key={stat.key}>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="font-semibold text-2xl tabular-nums">
                {stat.value}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium tabular-nums",
                  positive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-destructive/10 text-destructive",
                )}
              >
                <Icon className="size-3.5" />
                {positive ? "+" : ""}
                {stat.delta}%
              </span>
              <span className="text-muted-foreground">{stat.hint}</span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
