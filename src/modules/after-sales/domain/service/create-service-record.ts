import { getVehicleById } from "@/modules/inventory/domain/repo/list-vehicles";
import { getCustomerById } from "@/modules/sales/domain/repo/lookups";
import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import type { CreateServiceRecordDTO } from "../contracts";
import {
  hasSalesLinkForService,
  insertServiceRecord,
} from "../repo/service-records";

export async function createServiceRecordService(
  client: DbTransaction,
  params: {
    input: CreateServiceRecordDTO;
    performedBy: string;
  },
) {
  const vehicle = await getVehicleById(params.input.vehicleId, client);
  if (!vehicle) {
    throw new AppError("NOT_FOUND", "Vehicle not found");
  }

  const customer = await getCustomerById(params.input.customerId, client);
  if (!customer) {
    throw new AppError("NOT_FOUND", "Customer not found");
  }

  const linked = await hasSalesLinkForService(
    params.input.vehicleId,
    params.input.customerId,
    client,
  );
  if (!linked) {
    throw new AppError(
      "VALIDATION_LINK",
      "Customer is not linked to this vehicle via a confirmed sale",
    );
  }

  const isEv = vehicle.model.vehicleType === "ev";
  if (
    !isEv &&
    (params.input.batteryHealthPercent != null || params.input.batteryNotes)
  ) {
    throw new AppError(
      "VALIDATION_BATTERY",
      "Battery fields apply to EV vehicles only",
    );
  }

  const now = nowDate();
  const created = await insertServiceRecord(
    {
      ...params.input,
      performedBy: params.performedBy,
      performedAt: params.input.performedAt ?? now,
      createdAt: now,
    },
    client,
  );

  if (!created) {
    throw new AppError("CREATE_FAILED", "Failed to create service record");
  }

  return created;
}
