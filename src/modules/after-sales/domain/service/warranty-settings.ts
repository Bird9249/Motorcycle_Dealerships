import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import type { UpdateWarrantySettingsDTO } from "../contracts";
import {
  ensureWarrantySettings,
  getWarrantySettings,
  updateWarrantySettings,
} from "../repo/warranty-settings";

export async function getWarrantySettingsService(client: DbTransaction) {
  return ensureWarrantySettings(client);
}

export async function updateWarrantySettingsService(
  client: DbTransaction,
  input: UpdateWarrantySettingsDTO,
) {
  const before = await getWarrantySettings(client);
  const updated = await updateWarrantySettings(
    {
      vehicleMonths: input.vehicleMonths,
      motorMonths: input.motorMonths,
      batteryMonths: input.batteryMonths,
      updatedAt: nowDate(),
    },
    client,
  );
  return { before: before ?? undefined, updated };
}
