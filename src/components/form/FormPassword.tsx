import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Field, useFieldError } from "@/components/form/Field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

export type FormPasswordProps = {
  name: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  requiredMark?: boolean;
  placeholder?: string;
  className?: string;
};

export function FormPassword({
  name,
  label,
  hint,
  requiredMark,
  className,
  placeholder,
}: FormPasswordProps) {
  const { register } = useFormContext();
  const error = useFieldError(name);
  const [visible, setVisible] = useState(false);

  return (
    <Field name={name} label={label} hint={hint} requiredMark={requiredMark}>
      <InputGroup className={className}>
        <InputGroupInput
          id={name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          aria-invalid={!!error}
          {...register(name)}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label={visible ? "Hide password" : "Show password"}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}
