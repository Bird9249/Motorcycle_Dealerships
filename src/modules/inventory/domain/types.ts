import type { OffsetPageDTO } from "@/shared/contracts/base";
import type {
  BrandDTO,
  ColorDTO,
  CreateVehicleDTO,
  ModelDTO,
  UpdateVehicleDTO,
  VehicleDTO,
} from "../contracts";

export type VehicleType = "ice" | "ev";

export type VehicleIdentifierInput = {
  chassisNumber?: string | null;
  engineNumber?: string | null;
  batterySerialNumber?: string | null;
};

export type CreateVehicleInput = CreateVehicleDTO & {
  createdBy?: string | null;
};

export type UpdateVehicleInput = UpdateVehicleDTO;

export type VehicleRecord = VehicleDTO;

export type VehicleListItem = Omit<VehicleDTO, "documents">;
export type VehiclesListResult = OffsetPageDTO<VehicleListItem>;
export type VehicleDetailResult = VehicleDTO;
export type BrandsListResult = BrandDTO[];
export type ColorsListResult = ColorDTO[];
export type ModelsListResult = ModelDTO[];

export type IdentifierConflictField =
  | "chassisNumber"
  | "engineNumber"
  | "batterySerialNumber";

export function computeRegistrationReady(
  importInvoiceReceived: boolean,
  technicalInspectionReceived: boolean,
): boolean {
  return importInvoiceReceived && technicalInspectionReceived;
}

export function toPriceString(value: string | number): string {
  return typeof value === "number" ? value.toFixed(2) : value;
}

export function toOptionalPriceString(
  value: string | number | undefined | null,
): string | null {
  if (value === undefined || value === null) return null;
  return toPriceString(value);
}
