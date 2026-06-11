import type * as React from "react";
import {
  type FieldValues,
  FormProvider,
  type UseFormReturn,
} from "react-hook-form";
import { FieldGroup } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Props<T extends FieldValues> = {
  methods: UseFormReturn<T>;
  onSubmit: (values: T) => void | Promise<void>;
  className?: string;
  children: React.ReactNode;
};

export function FormRoot<T extends FieldValues>({
  methods,
  onSubmit,
  className,
  children,
}: Props<T>) {
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <FieldGroup className={cn("gap-4", className)}>{children}</FieldGroup>
      </form>
    </FormProvider>
  );
}
