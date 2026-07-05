import type { DbTransaction } from "@/shared/types";
import { insertPaymentSchedules } from "../repo/payment-schedules";
import {
  buildPaymentSchedulePreview,
  parseMoney,
} from "./calculate-installment";

export async function generatePaymentScheduleForOrder(
  client: DbTransaction,
  params: {
    salesOrderId: string;
    salePrice: string;
    downPayment: string | null;
    installmentMonths: number;
    interestRatePercent: string;
    saleCurrency: "LAK" | "THB" | "USD";
    soldAt: Date;
  },
) {
  const preview = buildPaymentSchedulePreview({
    principal: parseMoney(params.salePrice),
    downPayment: params.downPayment ? parseMoney(params.downPayment) : 0,
    installmentMonths: params.installmentMonths,
    interestRatePercent: parseMoney(params.interestRatePercent),
    currency: params.saleCurrency,
    soldAt: params.soldAt,
  });

  await insertPaymentSchedules(
    params.salesOrderId,
    preview.schedules,
    client,
  );

  return preview;
}
