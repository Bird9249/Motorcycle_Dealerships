import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import type { UpdateFinanceTransferDTO } from "../contracts";
import {
  getSalesOrderById,
  updateSalesOrderById,
} from "../repo/sales-orders";

export async function updateFinanceTransferService(
  client: DbTransaction,
  params: { id: string; input: UpdateFinanceTransferDTO },
) {
  const existing = await getSalesOrderById(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Sales order not found");
  }

  if (existing.paymentType !== "bank_finance") {
    throw new AppError(
      "VALIDATION_FINANCE",
      "Finance transfer tracking is only for bank finance orders",
    );
  }

  if (existing.status !== "confirmed" && existing.status !== "completed") {
    throw new AppError(
      "FORBIDDEN_UPDATE",
      "Finance transfer can only be updated on confirmed orders",
    );
  }

  const now = nowDate();

  const updated = await updateSalesOrderById(
    params.id,
    {
      financeTransferReceived: params.input.financeTransferReceived,
      financeTransferDate: params.input.financeTransferDate
        ? new Date(params.input.financeTransferDate)
        : null,
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
    financeTransferReceived: existing.financeTransferReceived,
    financeTransferDate: existing.financeTransferDate,
  };

  return { before, updated };
}
