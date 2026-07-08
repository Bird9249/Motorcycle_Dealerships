import { addMonths, startOfDay } from "date-fns";
import { getVehicleById } from "@/modules/inventory/domain/repo/list-vehicles";
import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import type { WarrantyType } from "../contracts";
import { ensureWarrantySettings } from "../repo/warranty-settings";
import {
  countWarrantiesBySalesOrderId,
  insertWarranty,
} from "../repo/warranties";

function toWarrantyStartDate(soldAt: Date): Date {
  return startOfDay(soldAt);
}

function toWarrantyEndDate(startDate: Date, durationMonths: number): Date {
  return startOfDay(addMonths(startDate, durationMonths));
}

export async function createWarrantiesOnSaleConfirm(
  client: DbTransaction,
  params: {
    salesOrderId: string;
    vehicleId: string;
    customerId: string;
    soldAt: Date;
  },
) {
  const existingCount = await countWarrantiesBySalesOrderId(
    params.salesOrderId,
    client,
  );
  if (existingCount > 0) {
    return { created: [], skipped: true as const };
  }

  const vehicle = await getVehicleById(params.vehicleId, client);
  if (!vehicle) {
    throw new AppError("NOT_FOUND", "Vehicle not found for warranty creation");
  }

  const settings = await ensureWarrantySettings(client);
  const startDate = toWarrantyStartDate(params.soldAt);
  const now = nowDate();

  const specs: Array<{
    warrantyType: WarrantyType;
    durationMonths: number;
    batterySerialNumber?: string | null;
  }> = [
    { warrantyType: "vehicle", durationMonths: settings.vehicleMonths },
    { warrantyType: "motor", durationMonths: settings.motorMonths },
  ];

  if (vehicle.model.vehicleType === "ev") {
    specs.push({
      warrantyType: "battery",
      durationMonths: settings.batteryMonths,
      batterySerialNumber: vehicle.batterySerialNumber,
    });
  }

  const created = [];
  for (const spec of specs) {
    const row = await insertWarranty(
      {
        vehicleId: params.vehicleId,
        customerId: params.customerId,
        salesOrderId: params.salesOrderId,
        warrantyType: spec.warrantyType,
        startDate,
        endDate: toWarrantyEndDate(startDate, spec.durationMonths),
        durationMonths: spec.durationMonths,
        batterySerialNumber:
          spec.warrantyType === "battery" ? spec.batterySerialNumber : null,
        createdAt: now,
        updatedAt: now,
      },
      client,
    );
    if (row) created.push(row);
  }

  return { created, skipped: false as const };
}
