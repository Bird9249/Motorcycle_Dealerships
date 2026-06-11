import type * as React from "react";
import { useFormContext } from "react-hook-form";
import {
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  Field as FieldLayout,
} from "@/components/ui/field";

type Props = {
  name: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  requiredMark?: boolean;
  className?: string;
  orientation?: "vertical" | "horizontal" | "responsive";
  children: React.ReactNode;
};

export function useFieldError(name: string): string | undefined {
  const {
    formState: { errors },
  } = useFormContext();
  const error = name
    .split(".")
    // biome-ignore lint/suspicious/noExplicitAny: traversing nested error tree
    .reduce<any>((acc, key) => (acc == null ? acc : acc[key]), errors);
  const message = error?.message;
  return typeof message === "string" ? message : undefined;
}

export function Field({
  name,
  label,
  hint,
  requiredMark,
  className,
  orientation = "vertical",
  children,
}: Props) {
  const message = useFieldError(name);

  return (
    <FieldLayout
      className={className}
      data-invalid={!!message || undefined}
      orientation={orientation}
    >
      {label ? (
        <FieldLabel htmlFor={name}>
          {label}
          {requiredMark ? <span className="text-destructive"> *</span> : null}
        </FieldLabel>
      ) : null}
      <FieldContent>
        {children}
        {message ? (
          <FieldError>{message}</FieldError>
        ) : hint ? (
          <FieldDescription>{hint}</FieldDescription>
        ) : null}
      </FieldContent>
    </FieldLayout>
  );
}
