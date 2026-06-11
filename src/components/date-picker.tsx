import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import type { DateRange as RdpDateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type DateRange = {
  from?: Date;
  to?: Date;
};

type CaptionLayout =
  | "label"
  | "dropdown"
  | "dropdown-months"
  | "dropdown-years"
  | undefined;

type BaseProps = {
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  captionLayout?: CaptionLayout;
  fromYear?: number;
  toYear?: number;
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
};

type SingleProps = BaseProps & {
  mode?: "single";
  value?: Date | null;
  onChange?: (date: Date | null) => void;
};

type RangeProps = BaseProps & {
  mode: "range";
  value?: DateRange | undefined;
  onChange?: (range: DateRange | undefined) => void;
};

export type DatePickerProps = SingleProps | RangeProps;

export function DatePicker(props: DatePickerProps) {
  const {
    placeholder = "ເລືອກວັນທີ",
    disabled,
    className,
    captionLayout = "label",
    fromYear,
    toYear,
    buttonVariant = "outline",
  } = props;
  const [open, setOpen] = React.useState(false);

  const startMonth = fromYear ? new Date(fromYear, 0) : undefined;
  const endMonth = toYear ? new Date(toYear, 11) : undefined;

  const label = React.useMemo(() => {
    if (props.mode === "range") {
      const range = props.value;
      if (range?.from && range?.to) {
        return `${format(range.from, "dd/MM/yyyy")} - ${format(range.to, "dd/MM/yyyy")}`;
      }
      if (range?.from) return format(range.from, "dd/MM/yyyy");
      return null;
    }
    return props.value ? format(props.value, "dd/MM/yyyy") : null;
  }, [props]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={buttonVariant}
          disabled={disabled}
          className={cn(
            "justify-start text-left font-normal",
            !label && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon />
          {label ?? placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {props.mode === "range" ? (
          <Calendar
            mode="range"
            captionLayout={captionLayout}
            startMonth={startMonth}
            endMonth={endMonth}
            selected={props.value as RdpDateRange | undefined}
            onSelect={(range) =>
              props.onChange?.(
                range ? { from: range.from, to: range.to } : undefined,
              )
            }
            autoFocus
          />
        ) : (
          <Calendar
            mode="single"
            captionLayout={captionLayout}
            startMonth={startMonth}
            endMonth={endMonth}
            selected={props.value ?? undefined}
            onSelect={(date) => {
              props.onChange?.(date ?? null);
              setOpen(false);
            }}
            autoFocus
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
