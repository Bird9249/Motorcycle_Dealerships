import { eq } from "drizzle-orm";
import { warrantySettings } from "@/server/platform/db/schema/after-sales";
import type { DbTransaction } from "@/shared/types";
import { DEFAULT_WARRANTY_SETTINGS } from "../contracts";

const SETTINGS_ID = "default";

export async function getWarrantySettings(client: DbTransaction) {
  const rows = await client
    .select({
      id: warrantySettings.id,
      vehicleMonths: warrantySettings.vehicleMonths,
      motorMonths: warrantySettings.motorMonths,
      batteryMonths: warrantySettings.batteryMonths,
      updatedAt: warrantySettings.updatedAt,
    })
    .from(warrantySettings)
    .where(eq(warrantySettings.id, SETTINGS_ID))
    .limit(1);
  return rows[0] ?? null;
}

export async function ensureWarrantySettings(client: DbTransaction) {
  const existing = await getWarrantySettings(client);
  if (existing) return existing;

  const now = new Date();
  const [created] = await client
    .insert(warrantySettings)
    .values({
      id: SETTINGS_ID,
      vehicleMonths: DEFAULT_WARRANTY_SETTINGS.vehicleMonths,
      motorMonths: DEFAULT_WARRANTY_SETTINGS.motorMonths,
      batteryMonths: DEFAULT_WARRANTY_SETTINGS.batteryMonths,
      updatedAt: now,
    })
    .onConflictDoNothing()
    .returning({
      id: warrantySettings.id,
      vehicleMonths: warrantySettings.vehicleMonths,
      motorMonths: warrantySettings.motorMonths,
      batteryMonths: warrantySettings.batteryMonths,
      updatedAt: warrantySettings.updatedAt,
    });

  if (created) return created;
  return (await getWarrantySettings(client))!;
}

export async function updateWarrantySettings(
  values: {
    vehicleMonths: number;
    motorMonths: number;
    batteryMonths: number;
    updatedAt: Date;
  },
  client: DbTransaction,
) {
  const [updated] = await client
    .insert(warrantySettings)
    .values({
      id: SETTINGS_ID,
      ...values,
    })
    .onConflictDoUpdate({
      target: warrantySettings.id,
      set: {
        vehicleMonths: values.vehicleMonths,
        motorMonths: values.motorMonths,
        batteryMonths: values.batteryMonths,
        updatedAt: values.updatedAt,
      },
    })
    .returning({
      id: warrantySettings.id,
      vehicleMonths: warrantySettings.vehicleMonths,
      motorMonths: warrantySettings.motorMonths,
      batteryMonths: warrantySettings.batteryMonths,
      updatedAt: warrantySettings.updatedAt,
    });
  return updated ?? null;
}
