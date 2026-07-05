import { z } from "zod";

export const VehicleDocumentTypeSchema = z.enum([
  "import_invoice",
  "technical_inspection",
  "other",
]);

export const CreateVehicleDocumentSchema = z.object({
  documentType: VehicleDocumentTypeSchema,
  fileKey: z.string().min(1),
  fileName: z.string().min(1),
});

export const UpdateVehicleDocumentStatusSchema = z
  .object({
    importInvoiceReceived: z.boolean().optional(),
    technicalInspectionReceived: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.importInvoiceReceived !== undefined ||
      data.technicalInspectionReceived !== undefined,
    { message: "At least one document status field is required" },
  );

export type VehicleDocumentType = z.infer<typeof VehicleDocumentTypeSchema>;
export type CreateVehicleDocumentDTO = z.infer<
  typeof CreateVehicleDocumentSchema
>;
export type UpdateVehicleDocumentStatusDTO = z.infer<
  typeof UpdateVehicleDocumentStatusSchema
>;

export const VehicleDocumentSchema = z.object({
  id: z.string(),
  documentType: VehicleDocumentTypeSchema,
  fileKey: z.string(),
  fileName: z.string(),
  uploadedAt: z.coerce.date(),
  uploadedBy: z.string().nullable(),
});

export type VehicleDocumentDTO = z.infer<typeof VehicleDocumentSchema>;
