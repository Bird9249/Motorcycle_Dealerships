import { Field, RHF } from "@devhop/ui";
import type * as React from "react";
import { InfiniteCombobox } from "./InfiniteCombobox";

type FormInfiniteComboboxProps<T> = {
  name: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  requiredMark?: boolean;
  queryKey: Array<string>;
  queryFn: (params: {
    search: string;
    pageParam: number;
  }) => Promise<{ items: Array<T>; nextPage: number | null }>;
  preloadQueryFn: (id: string) => Promise<T | null>;
  getLabel: (item: T) => string;
  getValue: (item: T) => string;
  getDisabled?: (item: T) => boolean;
  placeholder?: string;
  className?: string;
  clearable?: boolean;
};

export function FormInfiniteCombobox<T>({
  name,
  label,
  hint,
  requiredMark,
  queryKey,
  queryFn,
  preloadQueryFn,
  getLabel,
  getValue,
  getDisabled,
  placeholder,
  className,
  clearable,
}: FormInfiniteComboboxProps<T>) {
  const { Controller, useFormContext } = RHF;
  const { control } = useFormContext();

  return (
    <Field name={name} label={label} hint={hint} requiredMark={requiredMark}>
      <Controller
        control={control}
        name={name as never}
        render={({ field }) => (
          <InfiniteCombobox<T>
            queryKey={queryKey}
            queryFn={queryFn}
            preloadQueryFn={preloadQueryFn}
            getLabel={getLabel}
            getValue={getValue}
            getDisabled={getDisabled}
            value={(field.value as string) ?? ""}
            onValueChange={field.onChange}
            placeholder={placeholder}
            className={className}
            clearable={clearable}
          />
        )}
      />
    </Field>
  );
}
