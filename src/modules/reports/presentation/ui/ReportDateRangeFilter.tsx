import {
  DatePicker,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/kit";
import { formatDateForInput, parseISO } from "@/shared/lib/date-time";
import {
  REPORT_PERIOD_OPTIONS,
  type ReportPeriodValue,
} from "../lib/labels";

export type ReportDateRangeValue = {
  period: ReportPeriodValue;
  dateFrom?: string;
  dateTo?: string;
};

type ReportDateRangeFilterProps = {
  value: ReportDateRangeValue;
  onChange: (value: ReportDateRangeValue) => void;
};

export function ReportDateRangeFilter({
  value,
  onChange,
}: ReportDateRangeFilterProps) {
  const isCustom = value.period === "custom";

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-[180px] flex-col gap-1.5">
          <Label>ໄລຍະເວລາ</Label>
          <Select
            value={value.period}
            onValueChange={(period) =>
              onChange({
                ...value,
                period: period as ReportPeriodValue,
                ...(period !== "custom"
                  ? { dateFrom: undefined, dateTo: undefined }
                  : {}),
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORT_PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isCustom ? (
          <>
            <div className="flex flex-col gap-1.5">
              <Label>ຕັ້ງແຕ່</Label>
              <DatePicker
                value={value.dateFrom ? parseISO(value.dateFrom) : undefined}
                onChange={(date) =>
                  onChange({
                    ...value,
                    dateFrom: date ? formatDateForInput(date) : undefined,
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>ຫາກວ່າ</Label>
              <DatePicker
                value={value.dateTo ? parseISO(value.dateTo) : undefined}
                onChange={(date) =>
                  onChange({
                    ...value,
                    dateTo: date ? formatDateForInput(date) : undefined,
                  })
                }
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
