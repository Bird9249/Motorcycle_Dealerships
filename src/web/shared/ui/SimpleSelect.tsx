import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@devhop/ui";
import type { ComponentPropsWithoutRef } from "react";

export type SimpleSelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

export type SimpleSelectProps = Omit<
  ComponentPropsWithoutRef<typeof Select>,
  "children"
> & {
  placeholder?: string;
  className?: string;
  contentClassName?: string;
  options: SimpleSelectOption[];
};

export function SimpleSelect({
  placeholder,
  className,
  contentClassName,
  options,
  ...selectProps
}: SimpleSelectProps) {
  return (
    <Select {...selectProps}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
