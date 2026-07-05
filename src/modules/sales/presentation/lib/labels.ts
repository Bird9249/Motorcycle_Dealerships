export const CURRENCY_OPTIONS = [
  { value: "LAK", label: "LAK (₭)" },
  { value: "THB", label: "THB (฿)" },
  { value: "USD", label: "USD ($)" },
] as const;

export type SaleCurrency = (typeof CURRENCY_OPTIONS)[number]["value"];

export const CURRENCY_LABELS: Record<SaleCurrency, string> = {
  LAK: "LAK (₭)",
  THB: "THB (฿)",
  USD: "USD ($)",
};

export type SalesOrderStatus =
  | "draft"
  | "confirmed"
  | "completed"
  | "cancelled";

export type SalePaymentType = "cash" | "bank_finance" | "in_house_leasing";

export const SALES_STATUS_LABELS: Record<SalesOrderStatus, string> = {
  draft: "ຮ່າງ",
  confirmed: "ຢືນຢັນແລ້ວ",
  completed: "ສຳເລັດ",
  cancelled: "ຍົກເລີກ",
};

export const PAYMENT_TYPE_LABELS: Record<SalePaymentType, string> = {
  cash: "ຊື້ສົດ",
  bank_finance: "ໄຟແນນ",
  in_house_leasing: "ຜ່ອນຮ້ານ",
};

export const SALES_STATUS_OPTIONS = (
  Object.entries(SALES_STATUS_LABELS) as [SalesOrderStatus, string][]
).map(([value, label]) => ({ value, label }));

export const PAYMENT_TYPE_OPTIONS = (
  Object.entries(PAYMENT_TYPE_LABELS) as [SalePaymentType, string][]
).map(([value, label]) => ({ value, label }));

export const SCHEDULE_STATUS_LABELS = {
  pending: "ລໍຖ້າ",
  paid: "ຊຳລະແລ້ວ",
  overdue: "ເກີນກຳນົດ",
  waived: "ຍົກເວັ້ນ",
} as const;

export function formatCurrencyAmount(
  amount: string | number,
  currency: SaleCurrency,
): string {
  const value = typeof amount === "number" ? amount : Number.parseFloat(amount);
  const formatted = Number.isFinite(value)
    ? value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : String(amount);

  if (currency === "LAK") return `${formatted} ₭`;
  if (currency === "THB") return `฿${formatted}`;
  return `$${formatted}`;
}
