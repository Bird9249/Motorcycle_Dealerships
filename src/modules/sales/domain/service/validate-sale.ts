import { AppError } from "@/shared/errors";
import type { DbTransaction } from "@/shared/types";
import { getVehicleById } from "@/modules/inventory/domain/repo/list-vehicles";
import type { CreateSalesOrderDTO, UpdateSalesOrderDTO } from "../contracts";
import { findActiveOrderForVehicle } from "../repo/sales-orders";
import { getCustomerById, getFinanceCompanyById } from "../repo/lookups";

export async function assertCustomerExists(
  client: DbTransaction,
  customerId: string,
) {
  const customer = await getCustomerById(customerId, client);
  if (!customer) {
    throw new AppError("NOT_FOUND", "Customer not found");
  }
  return customer;
}

export async function assertVehicleForNewSale(
  client: DbTransaction,
  vehicleId: string,
) {
  const vehicle = await getVehicleById(vehicleId, client);
  if (!vehicle) {
    throw new AppError("NOT_FOUND", "Vehicle not found");
  }
  if (vehicle.status !== "in_stock") {
    throw new AppError(
      "VALIDATION_VEHICLE_STATUS",
      "Vehicle must be in stock to create a sale",
    );
  }
  return vehicle;
}

export async function assertVehicleAvailableForOrder(
  client: DbTransaction,
  vehicleId: string,
  orderId?: string,
) {
  const vehicle = await getVehicleById(vehicleId, client);
  if (!vehicle) {
    throw new AppError("NOT_FOUND", "Vehicle not found");
  }

  const activeOrder = await findActiveOrderForVehicle(
    vehicleId,
    client,
    orderId,
  );
  if (activeOrder && activeOrder.id !== orderId) {
    throw new AppError(
      "CONFLICT",
      "Vehicle already has an active sales order",
    );
  }

  if (vehicle.status !== "in_stock" && vehicle.status !== "reserved") {
    throw new AppError(
      "VALIDATION_VEHICLE_STATUS",
      "Vehicle is not available for sale",
    );
  }

  return vehicle;
}

export async function assertFinanceCompanyIfProvided(
  client: DbTransaction,
  financeCompanyId: string | null | undefined,
) {
  if (!financeCompanyId) return null;
  const company = await getFinanceCompanyById(financeCompanyId, client);
  if (!company) {
    throw new AppError("NOT_FOUND", "Finance company not found");
  }
  if (!company.isActive) {
    throw new AppError(
      "VALIDATION_FINANCE_COMPANY",
      "Finance company is inactive",
    );
  }
  return company;
}

export function assertDraftStatus(status: string) {
  if (status !== "draft") {
    throw new AppError(
      "FORBIDDEN_UPDATE",
      "Only draft orders can be modified",
    );
  }
}

export function assertCancellable(status: string) {
  if (status !== "draft") {
    throw new AppError(
      "FORBIDDEN_CANCEL",
      "Only draft orders can be cancelled",
    );
  }
}

export function assertConfirmable(status: string) {
  if (status !== "draft") {
    throw new AppError(
      "FORBIDDEN_CONFIRM",
      "Only draft orders can be confirmed",
    );
  }
}

export function assertCompletable(order: {
  status: string;
  paymentType: string;
  financeTransferReceived: boolean;
}) {
  if (order.status !== "confirmed") {
    throw new AppError(
      "FORBIDDEN_COMPLETE",
      "Only confirmed orders can be marked completed",
    );
  }
  if (
    order.paymentType === "bank_finance" &&
    !order.financeTransferReceived
  ) {
    throw new AppError(
      "VALIDATION_FINANCE",
      "Finance transfer must be received before completing the sale",
    );
  }
}

export function assertPaymentTypeFieldsForWrite(input: {
  paymentType: string;
  financeCompanyId?: string | null;
  installmentMonths?: number | null;
  interestRatePercent?: string | number | null;
}) {
  if (input.paymentType === "bank_finance" && !input.financeCompanyId) {
    throw new AppError(
      "VALIDATION_FINANCE",
      "Finance company is required for bank finance sales",
    );
  }

  if (input.paymentType === "in_house_leasing") {
    if (!input.installmentMonths || input.installmentMonths <= 0) {
      throw new AppError(
        "VALIDATION_LEASING",
        "Installment months is required for in-house leasing",
      );
    }
    if (
      input.interestRatePercent === undefined ||
      input.interestRatePercent === null
    ) {
      throw new AppError(
        "VALIDATION_LEASING",
        "Interest rate is required for in-house leasing",
      );
    }
  }
}

export function assertInHouseLeasingForConfirm(order: {
  installmentMonths: number | null;
  interestRatePercent: string | null;
}) {
  if (!order.installmentMonths || order.installmentMonths <= 0) {
    throw new AppError(
      "VALIDATION_LEASING",
      "Installment months is required to confirm in-house leasing",
    );
  }
  if (order.interestRatePercent === null) {
    throw new AppError(
      "VALIDATION_LEASING",
      "Interest rate is required to confirm in-house leasing",
    );
  }
}

export function normalizeSaleFields(
  input: CreateSalesOrderDTO | UpdateSalesOrderDTO,
) {
  return {
    financeCompanyId: input.financeCompanyId ?? null,
    financeApprovedAmount: input.financeApprovedAmount ?? null,
    financeTransferReceived: input.financeTransferReceived ?? false,
    financeTransferDate: input.financeTransferDate
      ? new Date(input.financeTransferDate)
      : null,
    downPayment: input.downPayment ?? null,
    downPaymentCurrency: input.downPaymentCurrency ?? null,
    installmentMonths: input.installmentMonths ?? null,
    interestRatePercent: input.interestRatePercent ?? null,
    monthlyInstallment: input.monthlyInstallment ?? null,
    notes: input.notes ?? null,
    exchangeRateUsed: input.exchangeRateUsed ?? null,
  };
}
