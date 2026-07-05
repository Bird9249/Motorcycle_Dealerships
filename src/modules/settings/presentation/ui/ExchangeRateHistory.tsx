import { useMemo } from "react";
import { Badge } from "@/components/kit";
import type { ExchangeRateItem } from "@/modules/sales/presentation/api/client";
import { formatDateLocal } from "@/shared/lib/date-time";

type ExchangeRateHistoryProps = {
  data?: ExchangeRateItem[];
  latestEffectiveDate?: string;
  isLoading?: boolean;
};

type HistoryByDate = {
  date: string;
  lakRate?: string;
  thbRate?: string;
};

function groupHistoryByDate(rows: ExchangeRateItem[]): HistoryByDate[] {
  const map = new Map<string, HistoryByDate>();

  for (const row of rows) {
    const date = row.effectiveDate.slice(0, 10);
    const entry = map.get(date) ?? { date };
    if (row.targetCurrency === "LAK") entry.lakRate = row.rate;
    if (row.targetCurrency === "THB") entry.thbRate = row.rate;
    map.set(date, entry);
  }

  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
}

function formatRate(value: string | undefined) {
  if (!value) return "—";
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
}

function RateCell({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-2">
      <p className="text-muted-foreground text-xs">1 USD → {label}</p>
      <p className="font-semibold tabular-nums tracking-tight">
        {formatRate(value)}
      </p>
    </div>
  );
}

export function ExchangeRateHistory({
  data,
  latestEffectiveDate,
  isLoading,
}: ExchangeRateHistoryProps) {
  const grouped = useMemo(() => groupHistoryByDate(data ?? []), [data]);
  const latestDate = latestEffectiveDate?.slice(0, 10);

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">ກຳລັງໂຫຼດ...</p>;
  }

  if (grouped.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        ຍັງບໍ່ມີປະຫວັດ — ບັນທຶກອັດຕາແລກປ່ຽນຄັ້ງທຳອິດ
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="hidden gap-3 px-1 text-muted-foreground text-xs sm:grid sm:grid-cols-[minmax(140px,1fr)_1fr_1fr]">
        <span>ວັນທີມີຜົນ</span>
        <span>USD → LAK</span>
        <span>USD → THB</span>
      </div>

      <div className="space-y-2">
        {grouped.map((row) => {
          const isLatest = row.date === latestDate;
          return (
            <div
              key={row.date}
              className={`rounded-xl border p-4 transition-colors ${
                isLatest
                  ? "border-primary/40 bg-primary/5 shadow-sm"
                  : "bg-card"
              }`}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="font-medium text-sm">
                  {formatDateLocal(row.date)}
                </span>
                {isLatest ? (
                  <Badge variant="default" className="text-xs">
                    ລ່າສຸດ
                  </Badge>
                ) : null}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <RateCell label="LAK" value={row.lakRate} />
                <RateCell label="THB" value={row.thbRate} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
