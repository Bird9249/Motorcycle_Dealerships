import type * as React from "react";
import { useFormContext } from "react-hook-form";
import { Field, useFieldError } from "@/components/form/Field";
import { Textarea } from "@/components/ui/textarea";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  name: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  requiredMark?: boolean;
};

export function FormTextarea({
  name,
  label,
  hint,
  requiredMark,
  ...rest
}: Props) {
  const { register } = useFormContext();
  const error = useFieldError(name);

  return (
    <Field name={name} label={label} hint={hint} requiredMark={requiredMark}>
      <Textarea
        id={name}
        aria-invalid={!!error}
        {...register(name)}
        {...rest}
      />
    </Field>
  );
}
