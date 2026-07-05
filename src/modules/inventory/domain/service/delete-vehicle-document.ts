import { AppError } from "@/shared/errors";
import { logger } from "@/server/platform/observability/logger";
import { deleteObjectFromS3 } from "@/server/utils/s3-delete-object";
import type { DbTransaction } from "@/shared/types";
import { getVehicleById } from "../repo/list-vehicles";
import { deleteVehicleDocumentById } from "../repo/vehicle-documents";

export async function deleteVehicleDocumentService(
  client: DbTransaction,
  params: { vehicleId: string; docId: string },
) {
  const vehicle = await getVehicleById(params.vehicleId, client);
  if (!vehicle) {
    throw new AppError("NOT_FOUND", "Vehicle not found");
  }

  const deleted = await deleteVehicleDocumentById(client, params);
  if (!deleted) {
    throw new AppError("NOT_FOUND", "Document not found");
  }

  const s3Deleted = await deleteObjectFromS3(deleted.fileKey);
  if (!s3Deleted) {
    logger.warn(
      { vehicleId: params.vehicleId, docId: params.docId, fileKey: deleted.fileKey },
      "Failed to delete vehicle document from object store",
    );
  }

  const updatedVehicle = await getVehicleById(params.vehicleId, client);
  if (!updatedVehicle) {
    throw new AppError("NOT_FOUND", "Vehicle not found");
  }

  return { vehicle: updatedVehicle, deleted };
}
