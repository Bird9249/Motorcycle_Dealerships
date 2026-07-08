import { createWarrantiesOnSaleConfirm } from "@/modules/after-sales/domain/service/create-warranty-on-sale";
import { updateVehicleById } from "@/modules/inventory/domain/repo/list-vehicles";
import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import { resolveSnapshotRateForCurrency } from "../repo/exchange-rates";
import {
  getSalesOrderById,
  getSalesOrderSnapshot,
  updateSalesOrderById,
} from "../repo/sales-orders";
import {
  calculateMonthlyInstallment,
  parseMoney,
} from "./calculate-installment";
import { generatePaymentScheduleForOrder } from "./generate-payment-schedule";
import {
  assertConfirmable,
  assertFinanceCompanyIfProvided,
  assertInHouseLeasingForConfirm,
} from "./validate-sale";

function assertPaymentTypeForConfirm(order: {
  paymentType: string;
  financeCompanyId: string | null;
}) {
  if (order.paymentType === "bank_finance" && !order.financeCompanyId) {
    throw new AppError(
      "VALIDATION_FINANCE",
      "Finance company is required for bank finance sales",
    );
  }
}

export async function confirmSaleService(
  client: DbTransaction,
  params: { id: string },
) {
  const existing = await getSalesOrderSnapshot(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Sales order not found");
  }
  assertConfirmable(existing.status);
  assertPaymentTypeForConfirm(existing);

  await assertFinanceCompanyIfProvided(client, existing.financeCompanyId);

  const detail = await getSalesOrderById(params.id, client);
  if (!detail) {
    throw new AppError("NOT_FOUND", "Sales order not found");
  }

  if (
    detail.vehicle.status !== "reserved" &&
    detail.vehicle.status !== "in_stock"
  ) {
    throw new AppError(
      "VALIDATION_VEHICLE_STATUS",
      "Vehicle must be reserved or in stock to confirm sale",
    );
  }

  if (detail.paymentType === "in_house_leasing") {
    assertInHouseLeasingForConfirm(detail);
  }

  const now = nowDate();
  const exchangeRateUsed = await resolveSnapshotRateForCurrency(
    client,
    detail.saleCurrency,
    now,
  );

  let monthlyInstallment: string | undefined;
  if (detail.paymentType === "in_house_leasing") {
    monthlyInstallment = calculateMonthlyInstallment({
      principal: parseMoney(detail.salePrice),
      downPayment: detail.downPayment ? parseMoney(detail.downPayment) : 0,
      installmentMonths: detail.installmentMonths!,
      interestRatePercent: parseMoney(detail.interestRatePercent!),
    }).toFixed(2);
  }

  const updated = await updateSalesOrderById(
    params.id,
    {
      status: "confirmed",
      soldAt: now,
      exchangeRateUsed,
      ...(monthlyInstallment ? { monthlyInstallment } : {}),
      updatedAt: now,
    },
    client,
  );

  if (!updated) {
    throw new AppError("NOT_FOUND", "Sales order not found");
  }

  if (detail.paymentType === "in_house_leasing") {
    await generatePaymentScheduleForOrder(client, {
      salesOrderId: params.id,
      salePrice: detail.salePrice,
      downPayment: detail.downPayment,
      installmentMonths: detail.installmentMonths!,
      interestRatePercent: detail.interestRatePercent!,
      saleCurrency: detail.saleCurrency,
      soldAt: now,
    });
  }

  await updateVehicleById(
    existing.vehicleId,
    { status: "sold", soldAt: now, updatedAt: now },
    client,
  );

  await createWarrantiesOnSaleConfirm(client, {
    salesOrderId: params.id,
    vehicleId: existing.vehicleId,
    customerId: existing.customerId,
    soldAt: now,
  });

  const refreshed = await getSalesOrderById(params.id, client);
  return { before: existing, updated: refreshed ?? updated };
}
