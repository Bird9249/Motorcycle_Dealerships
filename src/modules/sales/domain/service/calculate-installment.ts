import { addMonths } from "date-fns";

type Currency = "LAK" | "THB" | "USD";

export type SchedulePreviewItem = {
  installmentNumber: number;
  dueDate: Date;
  amount: number;
  currency: Currency;
  status: "pending";
};

export function parseMoney(value: string | number): number {
  return typeof value === "number" ? value : Number.parseFloat(value);
}

export function formatMoney(value: number): string {
  return value.toFixed(2);
}

/** Standard amortization: monthly = loan × [r(1+r)^n] / [(1+r)^n - 1] */
export function calculateMonthlyInstallment(params: {
  principal: number;
  downPayment: number;
  installmentMonths: number;
  interestRatePercent: number;
}): number {
  const { principal, downPayment, installmentMonths, interestRatePercent } =
    params;

  const loan = Math.max(0, principal - downPayment);
  if (installmentMonths <= 0) return 0;
  if (loan === 0) return 0;

  const r = interestRatePercent / 12 / 100;
  if (r === 0) {
    return roundMoney(loan / installmentMonths);
  }

  const factor = (1 + r) ** installmentMonths;
  const monthly = (loan * (r * factor)) / (factor - 1);
  return roundMoney(monthly);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildPaymentSchedulePreview(params: {
  principal: number;
  downPayment: number;
  installmentMonths: number;
  interestRatePercent: number;
  currency: Currency;
  soldAt: Date;
}): {
  monthlyInstallment: string;
  totalFinanced: string;
  totalInterest: string;
  schedules: SchedulePreviewItem[];
} {
  const {
    principal,
    downPayment,
    installmentMonths,
    interestRatePercent,
    currency,
    soldAt,
  } = params;

  const loan = Math.max(0, principal - downPayment);
  const monthly = calculateMonthlyInstallment({
    principal,
    downPayment,
    installmentMonths,
    interestRatePercent,
  });

  const schedules: SchedulePreviewItem[] = [];
  let remaining = loan;

  for (let i = 1; i <= installmentMonths; i++) {
    const isLast = i === installmentMonths;
    const amount = isLast ? roundMoney(remaining) : monthly;
    remaining = roundMoney(remaining - amount);

    schedules.push({
      installmentNumber: i,
      dueDate: addMonths(soldAt, i),
      amount,
      currency,
      status: "pending",
    });
  }

  const totalPaid = schedules.reduce((sum, row) => sum + row.amount, 0);
  const totalInterest = roundMoney(Math.max(0, totalPaid - loan));

  return {
    monthlyInstallment: formatMoney(monthly),
    totalFinanced: formatMoney(loan),
    totalInterest: formatMoney(totalInterest),
    schedules,
  };
}
