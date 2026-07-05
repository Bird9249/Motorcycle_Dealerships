import { AppError } from "@/shared/errors";
import type { CreateModelDTO, UpdateModelDTO } from "../contracts/models";

type ModelFieldInput = Pick<
  CreateModelDTO,
  "vehicleType" | "engineCc" | "batteryCapacityKwh"
>;

export function assertModelFieldsForType(input: ModelFieldInput) {
  if (input.vehicleType === "ice") {
    if (input.batteryCapacityKwh != null && input.batteryCapacityKwh !== "") {
      throw new AppError(
        "VALIDATION_ICE_BATTERY",
        "ICE models cannot have battery capacity",
      );
    }
    return;
  }

  if (input.vehicleType === "ev") {
    if (input.engineCc != null) {
      throw new AppError(
        "VALIDATION_EV_ENGINE",
        "EV models cannot have engine displacement",
      );
    }
  }
}

export function normalizeModelFields(input: ModelFieldInput) {
  assertModelFieldsForType(input);

  if (input.vehicleType === "ice") {
    return {
      engineCc: input.engineCc ?? null,
      batteryCapacityKwh: null,
    };
  }

  return {
    engineCc: null,
    batteryCapacityKwh:
      input.batteryCapacityKwh != null && input.batteryCapacityKwh !== ""
        ? String(input.batteryCapacityKwh)
        : null,
  };
}

export function mergeModelFieldsForUpdate(
  existing: ModelFieldInput & { vehicleType: "ice" | "ev" },
  input: UpdateModelDTO,
) {
  const merged: ModelFieldInput = {
    vehicleType: input.vehicleType ?? existing.vehicleType,
    engineCc:
      input.engineCc !== undefined ? input.engineCc : existing.engineCc,
    batteryCapacityKwh:
      input.batteryCapacityKwh !== undefined
        ? input.batteryCapacityKwh
        : existing.batteryCapacityKwh,
  };
  return { merged, fields: normalizeModelFields(merged) };
}
