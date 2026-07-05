import { and, eq } from "drizzle-orm";
import { vehicleDocuments } from "@/server/platform/db/schema/inventory";
import type { DbTransaction } from "@/shared/types";

export async function insertVehicleDocument(
  client: DbTransaction,
  values: typeof vehicleDocuments.$inferInsert,
) {
  const [created] = await client
    .insert(vehicleDocuments)
    .values(values)
    .returning({
      id: vehicleDocuments.id,
      documentType: vehicleDocuments.documentType,
      fileKey: vehicleDocuments.fileKey,
      fileName: vehicleDocuments.fileName,
      uploadedAt: vehicleDocuments.uploadedAt,
      uploadedBy: vehicleDocuments.uploadedBy,
    });
  return created ?? null;
}

export async function deleteVehicleDocumentById(
  client: DbTransaction,
  params: { vehicleId: string; docId: string },
) {
  const [deleted] = await client
    .delete(vehicleDocuments)
    .where(
      and(
        eq(vehicleDocuments.id, params.docId),
        eq(vehicleDocuments.vehicleId, params.vehicleId),
      ),
    )
    .returning({
      id: vehicleDocuments.id,
      fileKey: vehicleDocuments.fileKey,
    });
  return deleted ?? null;
}

export async function getVehicleDocumentById(
  client: DbTransaction,
  params: { vehicleId: string; docId: string },
) {
  const rows = await client
    .select({
      id: vehicleDocuments.id,
      documentType: vehicleDocuments.documentType,
      fileKey: vehicleDocuments.fileKey,
      fileName: vehicleDocuments.fileName,
      uploadedAt: vehicleDocuments.uploadedAt,
      uploadedBy: vehicleDocuments.uploadedBy,
    })
    .from(vehicleDocuments)
    .where(
      and(
        eq(vehicleDocuments.id, params.docId),
        eq(vehicleDocuments.vehicleId, params.vehicleId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}
