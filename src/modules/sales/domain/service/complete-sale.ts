import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import {
  getSalesOrderById,
  getSalesOrderSnapshot,
  updateSalesOrderById,
} from "../repo/sales-orders";
import { assertCompletable } from "./validate-sale";

export async function completeSaleService(
  client: DbTransaction,
  params: { id: string },
) {
  const existing = await getSalesOrderSnapshot(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Sales order not found");
  }

  assertCompletable({
    status: existing.status,
    paymentType: existing.paymentType,
    financeTransferReceived: existing.financeTransferReceived,
  });

  const now = nowDate();
  const updated = await updateSalesOrderById(
    params.id,
    { status: "completed", updatedAt: now },
    client,
  );

  if (!updated) {
    throw new AppError("NOT_FOUND", "Sales order not found");
  }

  const refreshed = await getSalesOrderById(params.id, client);
  return { before: existing, updated: refreshed ?? updated };
}
