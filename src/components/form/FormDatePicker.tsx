import type * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { DatePicker } from "@/components/date-picker";
import { Field } from "@/components/form/Field";

type CaptionLayout =
  | "label"
  | "dropdown"
  | "dropdown-months"
  | "dropdown-years"
  | undefined;

type Props = {
  name: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  requiredMark?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  captionLayout?: CaptionLayout;
  fromYear?: number;
  toYear?: number;
};

export function FormDatePicker({
  name,
  label,
  hint,
  requiredMark,
  placeholder,
  disabled,
  className,
  captionLayout,
  fromYear,
  toYear,
}: Props) {
  const { control } = useFormContext();

  return (
    <Field name={name} label={label} hint={hint} requiredMark={requiredMark}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <DatePicker
            mode="single"
            value={(field.value as Date | null | undefined) ?? null}
            onChange={field.onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
            captionLayout={captionLayout}
            fromYear={fromYear}
            toYear={toYear}
          />
        )}
      />
    </Field>
  );
}
