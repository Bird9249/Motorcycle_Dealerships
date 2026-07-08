import type * as React from "react";
import { useFormContext } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, useFieldError } from "@/components/form/Field";

export type FormSelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type Props = {
  name: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  requiredMark?: boolean;
  placeholder?: string;
  options: FormSelectOption[];
  disabled?: boolean;
  className?: string;
};

export function FormSelect({
  name,
  label,
  hint,
  requiredMark,
  placeholder = "ເລືອກ...",
  options,
  disabled,
  className,
}: Props) {
  const { register, setValue, watch } = useFormContext();
  const value = watch(name) as string | undefined;
  const error = useFieldError(name);

  register(name);

  return (
    <Field
      name={name}
      label={label}
      hint={hint}
      requiredMark={requiredMark}
      className={className}
    >
      <Select
        value={value ?? ""}
        onValueChange={(next) => setValue(name, next, { shouldValidate: true })}
        disabled={disabled}
      >
        <SelectTrigger
          id={name}
          aria-invalid={!!error}
          className="w-full bg-background"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
