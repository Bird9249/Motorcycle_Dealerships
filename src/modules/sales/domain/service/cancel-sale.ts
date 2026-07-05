import { updateVehicleById } from "@/modules/inventory/domain/repo/list-vehicles";
import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import {
  getSalesOrderSnapshot,
  updateSalesOrderById,
} from "../repo/sales-orders";
import { assertCancellable } from "./validate-sale";

export async function cancelSaleService(
  client: DbTransaction,
  params: { id: string },
) {
  const existing = await getSalesOrderSnapshot(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Sales order not found");
  }
  assertCancellable(existing.status);

  const now = nowDate();

  const updated = await updateSalesOrderById(
    params.id,
    { status: "cancelled", updatedAt: now },
    client,
  );

  if (!updated) {
    throw new AppError("NOT_FOUND", "Sales order not found");
  }

  await updateVehicleById(
    existing.vehicleId,
    { status: "in_stock", updatedAt: now },
    client,
  );

  return { before: existing, updated };
}
