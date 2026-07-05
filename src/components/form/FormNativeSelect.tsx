import type * as React from "react";
import { useFormContext } from "react-hook-form";
import { Field, useFieldError } from "@/components/form/Field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

export type FormNativeSelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type Props = Omit<React.ComponentProps<"select">, "size"> & {
  name: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  requiredMark?: boolean;
  placeholder?: string;
  options: FormNativeSelectOption[];
  size?: "sm" | "default";
};

export function FormNativeSelect({
  name,
  label,
  hint,
  requiredMark,
  placeholder,
  options,
  size = "default",
  className,
  ...rest
}: Props) {
  const { register } = useFormContext();
  const error = useFieldError(name);

  return (
    <Field name={name} label={label} hint={hint} requiredMark={requiredMark}>
      <NativeSelect
        id={name}
        aria-invalid={!!error}
        className={className ?? "w-full"}
        size={size}
        defaultValue=""
        {...register(name)}
        {...rest}
      >
        {placeholder ? (
          <NativeSelectOption value="" disabled>
            {placeholder}
          </NativeSelectOption>
        ) : null}
        {options.map((opt) => (
          <NativeSelectOption
            key={opt.value}
            value={opt.value}
            disabled={opt.disabled}
          >
            {opt.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  );
}
