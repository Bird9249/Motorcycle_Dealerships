import { AppError } from "@/shared/errors";
import type { DbTransaction } from "@/shared/types";
import { deleteVehicleById, getVehicleById } from "../repo/list-vehicles";

export async function deleteVehicleService(
  client: DbTransaction,
  params: { id: string },
) {
  const existing = await getVehicleById(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Vehicle not found");
  }

  if (existing.status === "sold" || existing.status === "reserved") {
    throw new AppError(
      "FORBIDDEN_DELETE",
      "Cannot delete sold or reserved vehicles",
    );
  }

  const deleted = await deleteVehicleById(params.id, client);
  if (!deleted) {
    throw new AppError("NOT_FOUND", "Vehicle not found");
  }

  return { before: existing, deleted };
}
