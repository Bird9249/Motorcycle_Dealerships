import { z } from "zod";
import { OffsetPageQuerySchema } from "@/shared/contracts/base";

export const VehicleStatusSchema = z.enum([
  "in_stock",
  "reserved",
  "sold",
  "in_service",
  "written_off",
]);

export const VehicleTypeSchema = z.enum(["ice", "ev"]);

export const CurrencySchema = z.enum(["LAK", "THB", "USD"]);

export const IdParamSchema = z.object({ id: z.string().min(1) });

export const VehicleDocumentParamSchema = z.object({
  id: z.string().min(1),
  docId: z.string().min(1),
});

const priceSchema = z.union([
  z.string().regex(/^\d+(\.\d{1,2})?$/),
  z.number().nonnegative(),
]);

const optionalTrimmedString = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? undefined : v))
  .optional();

export const CreateVehicleSchema = z.object({
  modelId: z.string().min(1),
  colorId: z.string().min(1),
  chassisNumber: optionalTrimmedString,
  engineNumber: optionalTrimmedString,
  batterySerialNumber: optionalTrimmedString,
  batteryCapacityKwh: priceSchema.optional(),
  costPrice: priceSchema,
  costCurrency: CurrencySchema.default("LAK"),
  listPrice: priceSchema,
  listCurrency: CurrencySchema.default("LAK"),
  importInvoiceReceived: z.boolean().optional().default(false),
  technicalInspectionReceived: z.boolean().optional().default(false),
  importDate: z.iso.date().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const UpdateVehicleSchema = CreateVehicleSchema.partial();

export const UpdateVehicleStatusSchema = z.object({
  status: VehicleStatusSchema,
});

export const VehiclesListQuerySchema = OffsetPageQuerySchema.extend({
  status: VehicleStatusSchema.optional(),
  brandId: z.string().min(1).optional(),
  modelId: z.string().min(1).optional(),
  vehicleType: VehicleTypeSchema.optional(),
  registrationReady: z.enum(["ready", "not_ready"]).optional(),
});

export const ModelsListQuerySchema = z.object({
  brandId: z.string().min(1).optional(),
});

export type CreateVehicleDTO = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicleDTO = z.infer<typeof UpdateVehicleSchema>;
export type UpdateVehicleStatusDTO = z.infer<typeof UpdateVehicleStatusSchema>;
export type VehiclesListQueryDTO = z.infer<typeof VehiclesListQuerySchema>;
export type ModelsListQueryDTO = z.infer<typeof ModelsListQuerySchema>;

export const VehicleSchema = z.object({
  id: z.string(),
  modelId: z.string(),
  colorId: z.string(),
  chassisNumber: z.string().nullable(),
  engineNumber: z.string().nullable(),
  batterySerialNumber: z.string().nullable(),
  batteryCapacityKwh: z.string().nullable(),
  status: VehicleStatusSchema,
  costPrice: z.string(),
  costCurrency: CurrencySchema,
  listPrice: z.string(),
  listCurrency: CurrencySchema,
  importInvoiceReceived: z.boolean(),
  technicalInspectionReceived: z.boolean(),
  registrationReady: z.boolean(),
  importDate: z.string().nullable(),
  notes: z.string().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  model: z.object({
    id: z.string(),
    name: z.string(),
    vehicleType: VehicleTypeSchema,
    engineCc: z.number().nullable(),
    batteryCapacityKwh: z.string().nullable(),
    year: z.number().nullable(),
  }),
  brand: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
  color: z.object({
    id: z.string(),
    name: z.string(),
    hexCode: z.string().nullable(),
  }),
  documents: z
    .array(
      z.object({
        id: z.string(),
        documentType: z.enum([
          "import_invoice",
          "technical_inspection",
          "other",
        ]),
        fileKey: z.string(),
        fileName: z.string(),
        uploadedAt: z.coerce.date(),
        uploadedBy: z.string().nullable(),
      }),
    )
    .optional()
    .default([]),
});

export type VehicleDTO = z.infer<typeof VehicleSchema>;

export const BrandSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  isActive: z.boolean(),
});

export const ModelSchema = z.object({
  id: z.string(),
  brandId: z.string(),
  name: z.string(),
  vehicleType: VehicleTypeSchema,
  engineCc: z.number().nullable(),
  batteryCapacityKwh: z.string().nullable(),
  year: z.number().nullable(),
  isActive: z.boolean(),
  brand: BrandSchema.optional(),
});

export type BrandDTO = z.infer<typeof BrandSchema>;

export const ColorSchema = z.object({
  id: z.string(),
  name: z.string(),
  hexCode: z.string().nullable(),
  isActive: z.boolean(),
});

export type ColorDTO = z.infer<typeof ColorSchema>;
export type ModelDTO = z.infer<typeof ModelSchema>;
