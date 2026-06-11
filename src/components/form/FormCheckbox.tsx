import type * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useFieldError } from "@/components/form/Field";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  Field as FieldLayout,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  requiredMark?: boolean;
  className?: string;
};

export function FormCheckbox({
  name,
  label,
  hint,
  requiredMark,
  className,
}: Props) {
  const { control } = useFormContext();
  const error = useFieldError(name);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <FieldLayout data-invalid={!!error || undefined} orientation="horizontal">
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <Checkbox
              id={name}
              checked={!!field.value}
              onCheckedChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              aria-invalid={!!error}
            />
          )}
        />
        {label ? (
          <FieldLabel htmlFor={name} className="font-normal">
            {label}
            {requiredMark ? <span className="text-destructive"> *</span> : null}
          </FieldLabel>
        ) : null}
      </FieldLayout>
      {error ? (
        <FieldError>{error}</FieldError>
      ) : hint ? (
        <FieldDescription>{hint}</FieldDescription>
      ) : null}
    </div>
  );
}
