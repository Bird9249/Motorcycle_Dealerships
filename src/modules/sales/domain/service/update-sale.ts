import { updateVehicleById } from "@/modules/inventory/domain/repo/list-vehicles";
import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import {
  getSalesOrderById,
  updateSalesOrderById,
} from "../repo/sales-orders";
import { resolveSnapshotRateForCurrency } from "../repo/exchange-rates";
import type { UpdateSalesOrderInput } from "../types";
import {
  toOptionalPriceString,
  toOptionalRateString,
  toPriceString,
} from "../types";
import {
  assertCustomerExists,
  assertDraftStatus,
  assertFinanceCompanyIfProvided,
  assertPaymentTypeFieldsForWrite,
  assertVehicleAvailableForOrder,
} from "./validate-sale";
import {
  calculateMonthlyInstallment,
  parseMoney,
} from "./calculate-installment";

export async function updateSaleService(
  client: DbTransaction,
  params: { id: string; input: UpdateSalesOrderInput },
) {
  const existing = await getSalesOrderById(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Sales order not found");
  }
  assertDraftStatus(existing.status);

  const vehicleId = params.input.vehicleId ?? existing.vehicleId;
  const customerId = params.input.customerId ?? existing.customerId;
  const paymentType = params.input.paymentType ?? existing.paymentType;
  const financeCompanyId =
    params.input.financeCompanyId !== undefined
      ? params.input.financeCompanyId
      : existing.financeCompanyId;

  if (params.input.customerId) {
    await assertCustomerExists(client, customerId);
  }

  if (params.input.vehicleId && params.input.vehicleId !== existing.vehicleId) {
    await assertVehicleAvailableForOrder(client, vehicleId, params.id);
  }

  if (paymentType === "bank_finance") {
    await assertFinanceCompanyIfProvided(client, financeCompanyId);
  } else if (params.input.financeCompanyId) {
    await assertFinanceCompanyIfProvided(client, params.input.financeCompanyId);
  }

  assertPaymentTypeFieldsForWrite({
    paymentType,
    financeCompanyId,
    installmentMonths:
      params.input.installmentMonths ?? existing.installmentMonths,
    interestRatePercent:
      params.input.interestRatePercent ?? existing.interestRatePercent,
  });

  const salePriceStr =
    params.input.salePrice !== undefined
      ? toPriceString(params.input.salePrice)
      : existing.salePrice;
  const downPaymentValue =
    params.input.downPayment !== undefined
      ? params.input.downPayment
      : existing.downPayment;
  const installmentMonthsValue =
    params.input.installmentMonths ?? existing.installmentMonths;
  const interestRateValue =
    params.input.interestRatePercent ?? existing.interestRatePercent;

  let monthlyInstallmentOverride: string | number | null | undefined;
  if (paymentType === "in_house_leasing") {
    monthlyInstallmentOverride = calculateMonthlyInstallment({
      principal: parseMoney(salePriceStr),
      downPayment: downPaymentValue ? parseMoney(downPaymentValue) : 0,
      installmentMonths: installmentMonthsValue!,
      interestRatePercent: parseMoney(interestRateValue!),
    });
  }

  const now = nowDate();

  const saleCurrency =
    params.input.saleCurrency ?? existing.saleCurrency;
  let exchangeRateUsedUpdate: string | null | undefined;
  if (params.input.exchangeRateUsed !== undefined) {
    exchangeRateUsedUpdate = toOptionalRateString(
      params.input.exchangeRateUsed,
    );
  } else if (
    params.input.saleCurrency !== undefined ||
    !existing.exchangeRateUsed
  ) {
    exchangeRateUsedUpdate = await resolveSnapshotRateForCurrency(
      client,
      saleCurrency,
    );
  }

  if (vehicleId !== existing.vehicleId) {
    await updateVehicleById(
      existing.vehicleId,
      { status: "in_stock", updatedAt: now },
      client,
    );
    await updateVehicleById(
      vehicleId,
      { status: "reserved", updatedAt: now },
      client,
    );
  }

  const updated = await updateSalesOrderById(
    params.id,
    {
      ...(params.input.vehicleId ? { vehicleId: params.input.vehicleId } : {}),
      ...(params.input.customerId
        ? { customerId: params.input.customerId }
        : {}),
      ...(params.input.salePrice !== undefined
        ? { salePrice: toPriceString(params.input.salePrice) }
        : {}),
      ...(params.input.saleCurrency
        ? { saleCurrency: params.input.saleCurrency }
        : {}),
      ...(exchangeRateUsedUpdate !== undefined
        ? { exchangeRateUsed: exchangeRateUsedUpdate }
        : {}),
      ...(params.input.paymentType
        ? { paymentType: params.input.paymentType }
        : {}),
      ...(params.input.financeCompanyId !== undefined
        ? { financeCompanyId: params.input.financeCompanyId }
        : {}),
      ...(params.input.financeApprovedAmount !== undefined
        ? {
            financeApprovedAmount: toOptionalPriceString(
              params.input.financeApprovedAmount,
            ),
          }
        : {}),
      ...(params.input.financeTransferReceived !== undefined
        ? {
            financeTransferReceived: params.input.financeTransferReceived,
          }
        : {}),
      ...(params.input.financeTransferDate !== undefined
        ? {
            financeTransferDate: params.input.financeTransferDate
              ? new Date(params.input.financeTransferDate)
              : null,
          }
        : {}),
      ...(params.input.downPayment !== undefined
        ? {
            downPayment: toOptionalPriceString(params.input.downPayment),
          }
        : {}),
      ...(params.input.downPaymentCurrency !== undefined
        ? { downPaymentCurrency: params.input.downPaymentCurrency }
        : {}),
      ...(params.input.installmentMonths !== undefined
        ? { installmentMonths: params.input.installmentMonths }
        : {}),
      ...(params.input.interestRatePercent !== undefined
        ? {
            interestRatePercent: toOptionalRateString(
              params.input.interestRatePercent,
            ),
          }
        : {}),
      ...(params.input.monthlyInstallment !== undefined
        ? {
            monthlyInstallment: toOptionalPriceString(
              params.input.monthlyInstallment,
            ),
          }
        : monthlyInstallmentOverride !== undefined
          ? {
              monthlyInstallment: toOptionalPriceString(
                monthlyInstallmentOverride,
              ),
            }
          : {}),
      ...(params.input.notes !== undefined ? { notes: params.input.notes } : {}),
      updatedAt: now,
    },
    client,
  );

  if (!updated) {
    throw new AppError("NOT_FOUND", "Sales order not found");
  }

  const before = {
    id: existing.id,
    orderNumber: existing.orderNumber,
    vehicleId: existing.vehicleId,
    customerId: existing.customerId,
    status: existing.status,
    paymentType: existing.paymentType,
    financeCompanyId: existing.financeCompanyId,
    salePrice: existing.salePrice,
    saleCurrency: existing.saleCurrency,
    soldAt: existing.soldAt,
  };

  return { before, updated };
}
