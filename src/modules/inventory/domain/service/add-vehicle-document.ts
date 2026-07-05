import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import type { CreateVehicleDocumentDTO } from "../contracts/documents";
import { getVehicleById, updateVehicleById } from "../repo/list-vehicles";
import { insertVehicleDocument } from "../repo/vehicle-documents";
import { computeRegistrationReady } from "../types";

function documentTypeToStatusPatch(documentType: CreateVehicleDocumentDTO["documentType"]) {
  if (documentType === "import_invoice") {
    return { importInvoiceReceived: true } as const;
  }
  if (documentType === "technical_inspection") {
    return { technicalInspectionReceived: true } as const;
  }
  return null;
}

export async function addVehicleDocumentService(
  client: DbTransaction,
  params: {
    vehicleId: string;
    input: CreateVehicleDocumentDTO;
    uploadedBy?: string | null;
  },
) {
  const vehicle = await getVehicleById(params.vehicleId, client);
  if (!vehicle) {
    throw new AppError("NOT_FOUND", "Vehicle not found");
  }

  const doc = await insertVehicleDocument(client, {
    vehicleId: params.vehicleId,
    documentType: params.input.documentType,
    fileKey: params.input.fileKey,
    fileName: params.input.fileName,
    uploadedBy: params.uploadedBy ?? null,
    uploadedAt: nowDate(),
  });

  if (!doc) {
    throw new AppError("CREATE_FAILED", "Failed to add document");
  }

  const statusPatch = documentTypeToStatusPatch(params.input.documentType);
  if (statusPatch) {
    const importInvoiceReceived =
      statusPatch.importInvoiceReceived ?? vehicle.importInvoiceReceived;
    const technicalInspectionReceived =
      statusPatch.technicalInspectionReceived ??
      vehicle.technicalInspectionReceived;

    await updateVehicleById(
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
  }

  const updated = await getVehicleById(params.vehicleId, client);
  if (!updated) {
    throw new AppError("NOT_FOUND", "Vehicle not found");
  }

  return { document: doc, vehicle: updated };
}
