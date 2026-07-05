import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import type { UpdateVehicleDocumentStatusDTO } from "../contracts/documents";
import { getVehicleById, updateVehicleById } from "../repo/list-vehicles";
import { computeRegistrationReady } from "../types";

export async function updateDocumentStatusService(
  client: DbTransaction,
  params: { vehicleId: string; input: UpdateVehicleDocumentStatusDTO },
) {
  const existing = await getVehicleById(params.vehicleId, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Vehicle not found");
  }

  const importInvoiceReceived =
    params.input.importInvoiceReceived ?? existing.importInvoiceReceived;
  const technicalInspectionReceived =
    params.input.technicalInspectionReceived ??
    existing.technicalInspectionReceived;

  const updated = await updateVehicleById(
    params.vehicleId,
    {
      importInvoiceReceived,
      technicalInspectionReceived,
      registrationReady: computeRegistrationReady(
        importInvoiceReceived,
        technicalInspectionReceived,
      ),
      updatedAt: nowDate(),
    },
    client,
  );

  if (!updated) {
    throw new AppError("NOT_FOUND", "Vehicle not found");
  }

  return { before: existing, updated };
}
