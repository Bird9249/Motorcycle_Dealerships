import {
  endOfDay,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
import type { DateRangeQueryDTO, ReportPeriod } from "../contracts";

export type ResolvedReportPeriod = {
  dateFrom: Date;
  dateTo: Date;
  preset: ReportPeriod | "custom";
};

export function resolveReportPeriod(
  query: DateRangeQueryDTO & { period?: ReportPeriod | "custom" },
): ResolvedReportPeriod {
  const now = new Date();
  const preset = query.period ?? "month";
  const dateTo = query.dateTo
    ? endOfDay(new Date(query.dateTo))
    : endOfDay(now);

  if (preset === "custom") {
    const dateFrom = query.dateFrom
      ? startOfDay(new Date(query.dateFrom))
      : startOfMonth(now);
    return { dateFrom, dateTo, preset: "custom" };
  }

  let dateFrom: Date;
  if (query.dateFrom) {
    dateFrom = startOfDay(new Date(query.dateFrom));
  } else if (preset === "day") {
    dateFrom = startOfDay(now);
  } else if (preset === "week") {
    dateFrom = startOfDay(subDays(now, 6));
  } else {
    dateFrom = startOfMonth(now);
  }

  return { dateFrom, dateTo, preset };
}
