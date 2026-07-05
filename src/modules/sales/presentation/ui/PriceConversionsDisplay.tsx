import { ArrowRightLeftIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CURRENCY_LABELS,
  formatCurrencyAmount,
  type SaleCurrency,
} from "../lib/labels";

export type PriceConversionItem = {
  currency: SaleCurrency;
  amount: string;
  isPrimary?: boolean;
};

type PriceConversionsDisplayProps = {
  conversions: PriceConversionItem[];
  rateEffectiveDate?: string | null;
  exchangeRateUsed?: string | null;
  saleCurrency?: SaleCurrency;
  className?: string;
};

export function PriceConversionsDisplay({
  conversions,
  rateEffectiveDate,
  exchangeRateUsed,
  saleCurrency,
  className,
}: PriceConversionsDisplayProps) {
  if (conversions.length === 0) return null;

  return (
    <div className={cn("rounded-lg border border-border/60 bg-muted/30 p-4", className)}>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
        <ArrowRightLeftIcon className="size-4 text-muted-foreground" />
        <span>ລາຄາເທົ່າກັນໃນສະກຸນອື່ນ (ອ່ານຢ່າງດຽວ)</span>
      </div>

      <ul className="grid gap-2 sm:grid-cols-3">
        {conversions.map((item) => (
          <li
            key={item.currency}
            className={cn(
              "rounded-md border px-3 py-2 text-sm",
              item.isPrimary
                ? "border-primary/30 bg-primary/5 font-medium"
                : "border-border/50 bg-background",
            )}
          >
            <div className="text-xs text-muted-foreground">
              {CURRENCY_LABELS[item.currency]}
              {item.isPrimary ? " · ຫຼັກ" : ""}
            </div>
            <div className="mt-0.5 tabular-nums">
              {formatCurrencyAmount(item.amount, item.currency)}
            </div>
          </li>
        ))}
      </ul>

      {(exchangeRateUsed || rateEffectiveDate) && (
        <p className="mt-3 text-xs text-muted-foreground">
          {saleCurrency && saleCurrency !== "USD" && exchangeRateUsed
            ? `ອັດຕາ USD→${saleCurrency}: ${exchangeRateUsed}`
            : null}
          {rateEffectiveDate
            ? `${exchangeRateUsed ? " · " : ""}ມີຜົນ ${rateEffectiveDate.slice(0, 10)}`
            : null}
        </p>
      )}
    </div>
  );
}
