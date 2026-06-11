import type * as React from "react";
import { useFormContext } from "react-hook-form";
import { Field, useFieldError } from "@/components/form/Field";
import { Input } from "@/components/ui/input";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  requiredMark?: boolean;
};

export function FormInput({ name, label, hint, requiredMark, ...rest }: Props) {
  const { register } = useFormContext();
  const error = useFieldError(name);

  return (
    <Field name={name} label={label} hint={hint} requiredMark={requiredMark}>
      <Input id={name} aria-invalid={!!error} {...register(name)} {...rest} />
    </Field>
  );
}
