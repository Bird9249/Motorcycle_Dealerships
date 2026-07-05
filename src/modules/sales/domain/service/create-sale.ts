import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import { updateVehicleById } from "@/modules/inventory/domain/repo/list-vehicles";
import { resolveSnapshotRateForCurrency } from "../repo/exchange-rates";
import {
  findActiveOrderForVehicle,
  generateOrderNumber,
  insertSalesOrder,
} from "../repo/sales-orders";
import type { CreateSalesOrderInput } from "../types";
import {
  toOptionalPriceString,
  toOptionalRateString,
  toPriceString,
} from "../types";
import {
  assertCustomerExists,
  assertFinanceCompanyIfProvided,
  assertPaymentTypeFieldsForWrite,
  assertVehicleForNewSale,
} from "./validate-sale";
import {
  calculateMonthlyInstallment,
  parseMoney,
} from "./calculate-installment";

export async function createSaleService(
  client: DbTransaction,
  params: { input: CreateSalesOrderInput },
) {
  const { input } = params;

  await assertCustomerExists(client, input.customerId);
  await assertVehicleForNewSale(client, input.vehicleId);
  const activeOrder = await findActiveOrderForVehicle(
    input.vehicleId,
    client,
  );
  if (activeOrder) {
    throw new AppError(
      "CONFLICT",
      "Vehicle already has an active sales order",
    );
  }
  await assertFinanceCompanyIfProvided(client, input.financeCompanyId);
  assertPaymentTypeFieldsForWrite({
    paymentType: input.paymentType,
    financeCompanyId: input.financeCompanyId,
    installmentMonths: input.installmentMonths,
    interestRatePercent: input.interestRatePercent,
  });

  const salePriceStr = toPriceString(input.salePrice);
  let monthlyInstallment = input.monthlyInstallment;
  if (input.paymentType === "in_house_leasing") {
    monthlyInstallment = calculateMonthlyInstallment({
      principal: parseMoney(salePriceStr),
      downPayment: input.downPayment ? parseMoney(input.downPayment) : 0,
      installmentMonths: input.installmentMonths!,
      interestRatePercent: parseMoney(input.interestRatePercent!),
    });
  }

  const orderNumber = await generateOrderNumber(client);
  const now = nowDate();
  const saleCurrency = input.saleCurrency ?? "LAK";
  const exchangeRateUsed =
    input.exchangeRateUsed !== undefined && input.exchangeRateUsed !== null
      ? toOptionalRateString(input.exchangeRateUsed)
      : await resolveSnapshotRateForCurrency(client, saleCurrency);

  const created = await insertSalesOrder(
    {
      orderNumber,
      vehicleId: input.vehicleId,
      customerId: input.customerId,
      salespersonId: input.salespersonId,
      salePrice: salePriceStr,
      saleCurrency,
      exchangeRateUsed,
      paymentType: input.paymentType,
      status: "draft",
      financeCompanyId: input.financeCompanyId ?? null,
      financeApprovedAmount: toOptionalPriceString(
        input.financeApprovedAmount,
      ),
      financeTransferReceived: input.financeTransferReceived ?? false,
      financeTransferDate: input.financeTransferDate
        ? new Date(input.financeTransferDate)
        : null,
      downPayment: toOptionalPriceString(input.downPayment),
      downPaymentCurrency: input.downPaymentCurrency ?? null,
      installmentMonths: input.installmentMonths ?? null,
      interestRatePercent: toOptionalRateString(input.interestRatePercent),
      monthlyInstallment: toOptionalPriceString(monthlyInstallment),
      notes: input.notes ?? null,
      createdBy: input.createdBy ?? input.salespersonId,
      createdAt: now,
      updatedAt: now,
    },
    client,
  );

  if (!created) {
    throw new AppError("CREATE_FAILED", "Failed to create sales order");
  }

  await updateVehicleById(
    input.vehicleId,
    { status: "reserved", updatedAt: now },
    client,
  );

  return { created };
}
