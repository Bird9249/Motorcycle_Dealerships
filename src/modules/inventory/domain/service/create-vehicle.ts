import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import { createVehicle } from "../repo/list-vehicles";
import type { CreateVehicleInput } from "../types";
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

export async function createVehicleService(
  client: DbTransaction,
  params: { input: CreateVehicleInput },
) {
  const { input } = params;
  const model = await assertModelAndColorExist(
    client,
    input.modelId,
    input.colorId,
  );

  const identifiers = {
    chassisNumber: input.chassisNumber ?? null,
    engineNumber: input.engineNumber ?? null,
    batterySerialNumber: input.batterySerialNumber ?? null,
  };

  assertVehicleFieldsForType(model.vehicleType, identifiers);
  await assertUniqueVehicleIdentifiers(client, identifiers);

  const importInvoiceReceived = input.importInvoiceReceived ?? false;
  const technicalInspectionReceived =
    input.technicalInspectionReceived ?? false;
  const now = nowDate();

  const created = await createVehicle(
    {
      modelId: input.modelId,
      colorId: input.colorId,
      chassisNumber: identifiers.chassisNumber,
      engineNumber: identifiers.engineNumber,
      batterySerialNumber: identifiers.batterySerialNumber,
      batteryCapacityKwh:
        toOptionalPriceString(input.batteryCapacityKwh) ??
        model.batteryCapacityKwh,
      costPrice: toPriceString(input.costPrice),
      costCurrency: input.costCurrency ?? "LAK",
      listPrice: toPriceString(input.listPrice),
      listCurrency: input.listCurrency ?? "LAK",
      importInvoiceReceived,
      technicalInspectionReceived,
      registrationReady: computeRegistrationReady(
        importInvoiceReceived,
        technicalInspectionReceived,
      ),
      importDate: input.importDate ? new Date(input.importDate) : null,
      notes: input.notes ?? null,
      createdBy: input.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    },
    client,
  );

  if (!created) {
    throw new AppError("CREATE_FAILED", "Failed to create vehicle");
  }

  return { created };
}
