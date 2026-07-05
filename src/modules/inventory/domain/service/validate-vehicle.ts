import { AppError } from "@/shared/errors";
import type { DbTransaction } from "@/shared/types";
import { getColorById } from "../repo/get-color-by-id";
import { getModelById } from "../repo/list-models";
import { findVehicleIdentifierConflicts } from "../repo/list-vehicles";
import type { VehicleIdentifierInput, VehicleType } from "../types";

export async function assertModelAndColorExist(
  client: DbTransaction,
  modelId: string,
  colorId: string,
) {
  const model = await getModelById(modelId, client);
  if (!model || !model.isActive) {
    throw new AppError("NOT_FOUND", "Model not found");
  }

  const color = await getColorById(colorId, client);
  if (!color || !color.isActive) {
    throw new AppError("NOT_FOUND", "Color not found");
  }

  return model;
}

export function assertVehicleFieldsForType(
  vehicleType: VehicleType,
  input: VehicleIdentifierInput,
) {
  if (vehicleType === "ice") {
    if (!input.chassisNumber?.trim()) {
      throw new AppError(
        "VALIDATION_ICE_CHASSIS",
        "Chassis number is required for ICE vehicles",
      );
    }
    if (!input.engineNumber?.trim()) {
      throw new AppError(
        "VALIDATION_ICE_ENGINE",
        "Engine number is required for ICE vehicles",
      );
    }
    return;
  }

  if (!input.batterySerialNumber?.trim()) {
    throw new AppError(
      "VALIDATION_EV_BATTERY",
      "Battery serial number is required for EV vehicles",
    );
  }
}

export async function assertUniqueVehicleIdentifiers(
  client: DbTransaction,
  input: VehicleIdentifierInput & { excludeId?: string },
) {
  const conflicts = await findVehicleIdentifierConflicts(client, input);
  if (conflicts.length === 0) return;

  const labels: Record<string, string> = {
    chassisNumber: "Chassis number",
    engineNumber: "Engine number",
    batterySerialNumber: "Battery serial number",
  };

  const message = conflicts
    .map((field) => `${labels[field]} already exists`)
    .join("; ");

  throw new AppError("CONFLICT", message);
}

export async function resolveVehicleTypeForModel(
  client: DbTransaction,
  modelId: string,
): Promise<VehicleType> {
  const model = await getModelById(modelId, client);
  if (!model) throw new AppError("NOT_FOUND", "Model not found");
  return model.vehicleType;
}
