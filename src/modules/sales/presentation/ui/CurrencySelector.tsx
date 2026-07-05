import {
  FormNativeSelect,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/kit";
import { CURRENCY_OPTIONS, type SaleCurrency } from "../lib/labels";

type CurrencySelectorProps = {
  name: string;
  label?: string;
  disabled?: boolean;
  requiredMark?: boolean;
};

export function CurrencySelector({
  name,
  label = "ສະກຸນເງິນ",
  disabled,
  requiredMark,
}: CurrencySelectorProps) {
  return (
    <FormNativeSelect
      name={name}
      label={label}
      options={[...CURRENCY_OPTIONS]}
      disabled={disabled}
      requiredMark={requiredMark}
    />
  );
}

type CurrencySelectProps = {
  value: SaleCurrency;
  onChange: (value: SaleCurrency) => void;
  label?: string;
  disabled?: boolean;
};

export function CurrencySelect({
  value,
  onChange,
  label = "ສະກຸນເງິນ",
  disabled,
}: CurrencySelectProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as SaleCurrency)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
