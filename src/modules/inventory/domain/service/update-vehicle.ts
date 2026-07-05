import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import { getVehicleById, updateVehicleById } from "../repo/list-vehicles";
import type { UpdateVehicleInput } from "../types";
import {
  computeRegistrationReady,
  toOptionalPriceString,
  toPriceString,
} from "../types";
import {
  assertModelAndColorExist,
  assertUniqueVehicleIdentifiers,
  assertVehicleFieldsForType,
} from "./validate-vehicle";

export async function updateVehicleService(
  client: DbTransaction,
  params: { id: string; input: UpdateVehicleInput },
) {
  const existing = await getVehicleById(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Vehicle not found");
  }

  if (existing.status === "sold" || existing.status === "reserved") {
    throw new AppError(
      "FORBIDDEN_UPDATE",
      "Cannot update sold or reserved vehicles",
    );
  }

  const modelId = params.input.modelId ?? existing.modelId;
  const colorId = params.input.colorId ?? existing.colorId;
  const model = await assertModelAndColorExist(client, modelId, colorId);

  const identifiers = {
    chassisNumber:
      params.input.chassisNumber !== undefined
        ? (params.input.chassisNumber ?? null)
        : existing.chassisNumber,
    engineNumber:
      params.input.engineNumber !== undefined
        ? (params.input.engineNumber ?? null)
        : existing.engineNumber,
    batterySerialNumber:
      params.input.batterySerialNumber !== undefined
        ? (params.input.batterySerialNumber ?? null)
        : existing.batterySerialNumber,
  };

  assertVehicleFieldsForType(model.vehicleType, identifiers);
  await assertUniqueVehicleIdentifiers(client, {
    ...identifiers,
    excludeId: params.id,
  });

  const importInvoiceReceived =
    params.input.importInvoiceReceived ?? existing.importInvoiceReceived;
  const technicalInspectionReceived =
    params.input.technicalInspectionReceived ??
    existing.technicalInspectionReceived;

  const updated = await updateVehicleById(
    params.id,
    {
      modelId,
      colorId,
      chassisNumber: identifiers.chassisNumber,
      engineNumber: identifiers.engineNumber,
      batterySerialNumber: identifiers.batterySerialNumber,
      batteryCapacityKwh:
        params.input.batteryCapacityKwh !== undefined
          ? toOptionalPriceString(params.input.batteryCapacityKwh)
          : existing.batteryCapacityKwh,
      costPrice:
        params.input.costPrice !== undefined
          ? toPriceString(params.input.costPrice)
          : undefined,
      costCurrency: params.input.costCurrency,
      listPrice:
        params.input.listPrice !== undefined
          ? toPriceString(params.input.listPrice)
          : undefined,
      listCurrency: params.input.listCurrency,
      importInvoiceReceived,
      technicalInspectionReceived,
      registrationReady: computeRegistrationReady(
        importInvoiceReceived,
        technicalInspectionReceived,
      ),
      importDate:
        params.input.importDate !== undefined
          ? params.input.importDate
            ? new Date(params.input.importDate)
            : null
          : existing.importDate
            ? new Date(existing.importDate)
            : null,
      notes:
        params.input.notes !== undefined ? params.input.notes : existing.notes,
      updatedAt: nowDate(),
    },
    client,
  );

  if (!updated) {
    throw new AppError("NOT_FOUND", "Vehicle not found");
  }

  return { before: existing, updated };
}
