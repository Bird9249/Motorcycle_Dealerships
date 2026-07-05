import { AppError } from "@/shared/errors";
import type { DbTransaction } from "@/shared/types";
import type {
  PreviewScheduleBodyDTO,
  PreviewScheduleStandaloneDTO,
} from "../contracts";
import { getSalesOrderById } from "../repo/sales-orders";
import {
  buildPaymentSchedulePreview,
  parseMoney,
} from "./calculate-installment";

function toPreviewResponse(
  preview: ReturnType<typeof buildPaymentSchedulePreview>,
) {
  return {
    monthlyInstallment: preview.monthlyInstallment,
    totalFinanced: preview.totalFinanced,
    totalInterest: preview.totalInterest,
    schedules: preview.schedules.map((row) => ({
      installmentNumber: row.installmentNumber,
      dueDate: row.dueDate.toISOString().slice(0, 10),
      amount: row.amount.toFixed(2),
      currency: row.currency,
      status: row.status,
    })),
  };
}

export function previewScheduleFromInput(input: PreviewScheduleStandaloneDTO) {
  const preview = buildPaymentSchedulePreview({
    principal: parseMoney(input.salePrice),
    downPayment: input.downPayment ? parseMoney(input.downPayment) : 0,
    installmentMonths: input.installmentMonths,
    interestRatePercent: parseMoney(input.interestRatePercent),
    currency: input.saleCurrency,
    soldAt: new Date(),
  });

  return toPreviewResponse(preview);
}

export async function previewScheduleService(
  client: DbTransaction,
  params: { orderId: string; overrides?: PreviewScheduleBodyDTO },
) {
  const order = await getSalesOrderById(params.orderId, client);
  if (!order) {
    throw new AppError("NOT_FOUND", "Sales order not found");
  }

  if (order.paymentType !== "in_house_leasing") {
    throw new AppError(
      "VALIDATION_LEASING",
      "Payment schedule preview is only for in-house leasing orders",
    );
  }

  const overrides = params.overrides ?? {};
  const salePrice = overrides.salePrice ?? order.salePrice;
  const downPayment =
    overrides.downPayment !== undefined
      ? overrides.downPayment
      : order.downPayment;
  const installmentMonths =
    overrides.installmentMonths ?? order.installmentMonths;
  const interestRatePercent =
    overrides.interestRatePercent !== undefined
      ? overrides.interestRatePercent
      : order.interestRatePercent;
  const saleCurrency = overrides.saleCurrency ?? order.saleCurrency;

  if (!installmentMonths || installmentMonths <= 0) {
    throw new AppError(
      "VALIDATION_LEASING",
      "Installment months is required for preview",
    );
  }
  if (interestRatePercent === null || interestRatePercent === undefined) {
    throw new AppError(
      "VALIDATION_LEASING",
      "Interest rate is required for preview",
    );
  }

  const soldAt = order.soldAt ?? new Date();

  const preview = buildPaymentSchedulePreview({
    principal: parseMoney(salePrice),
    downPayment: downPayment ? parseMoney(downPayment) : 0,
    installmentMonths,
    interestRatePercent: parseMoney(interestRatePercent),
    currency: saleCurrency,
    soldAt,
  });

  return toPreviewResponse(preview);
}
