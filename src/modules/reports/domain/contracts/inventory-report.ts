import { z } from "zod";
import { CurrencySchema } from "@/modules/sales/domain/contracts";

export const InventoryReportQuerySchema = z.object({
  dateTo: z.iso.date().optional(),
  brandLimit: z.coerce.number().int().min(1).max(20).default(10),
});

const StatusCountSchema = z.object({
  status: z.enum([
    "in_stock",
    "reserved",
    "sold",
    "in_service",
    "written_off",
  ]),
  count: z.number().int(),
});

const VehicleTypeCountSchema = z.object({
  vehicleType: z.enum(["ice", "ev"]),
  count: z.number().int(),
});

const BrandCountSchema = z.object({
  brandId: z.string(),
  brandName: z.string(),
  count: z.number().int(),
});

const ValueByCurrencySchema = z.object({
  currency: CurrencySchema,
  totalAmount: z.string(),
  count: z.number().int(),
});

export const InventoryReportSchema = z.object({
  snapshotAt: z.string(),
  totalVehicles: z.number().int(),
  byStatus: z.array(StatusCountSchema),
  byVehicleType: z.array(VehicleTypeCountSchema),
  byBrand: z.array(BrandCountSchema),
  costValueByCurrency: z.array(ValueByCurrencySchema),
  listValueByCurrency: z.array(ValueByCurrencySchema),
});

export type InventoryReportQueryDTO = z.infer<typeof InventoryReportQuerySchema>;
export type InventoryReportDTO = z.infer<typeof InventoryReportSchema>;
