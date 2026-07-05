import { cn } from "@/lib/utils";
import { Button } from "@/components/kit";
import {
  PAYMENT_TYPE_LABELS,
  type SalePaymentType,
} from "../lib/labels";

type FinancingTypeSelectorProps = {
  value: SalePaymentType;
  onChange: (value: SalePaymentType) => void;
  disabled?: boolean;
};

const OPTIONS: SalePaymentType[] = [
  "cash",
  "bank_finance",
  "in_house_leasing",
];

export function FinancingTypeSelector({
  value,
  onChange,
  disabled,
}: FinancingTypeSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {OPTIONS.map((opt) => (
        <Button
          key={opt}
          type="button"
          variant={value === opt ? "default" : "outline"}
          className={cn("h-auto py-3", disabled && "pointer-events-none opacity-60")}
          onClick={() => onChange(opt)}
          disabled={disabled}
        >
          {PAYMENT_TYPE_LABELS[opt]}
        </Button>
      ))}
    </div>
  );
}
