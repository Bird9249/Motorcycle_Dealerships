import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import type { UpdateVehicleStatusDTO } from "../contracts";
import { getVehicleById, updateVehicleById } from "../repo/list-vehicles";

export async function updateVehicleStatusService(
  client: DbTransaction,
  params: { id: string; input: UpdateVehicleStatusDTO },
) {
  const existing = await getVehicleById(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Vehicle not found");
  }

  if (existing.status === params.input.status) {
    return { before: existing, updated: existing };
  }

  const updated = await updateVehicleById(
    params.id,
    {
      status: params.input.status,
      updatedAt: nowDate(),
    },
    client,
  );

  if (!updated) {
    throw new AppError("NOT_FOUND", "Vehicle not found");
  }

  return { before: existing, updated };
}
