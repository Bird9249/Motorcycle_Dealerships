import type {
  CreateVehicleDTO,
  CreateVehicleDocumentDTO,
  ModelsListQueryDTO,
  UpdateVehicleDocumentStatusDTO,
  UpdateVehicleDTO,
  UpdateVehicleStatusDTO,
  VehicleStatusHistoryResult,
  VehiclesListQueryDTO,
} from "@/modules/inventory/domain/contracts";
import type {
  BrandsListResult,
  ColorsListResult,
  ModelsListResult,
  VehicleDetailResult,
  VehiclesListResult,
} from "@/modules/inventory/domain/types";
import { config } from "@/shared/lib/config";
import { fetcher } from "@/shared/lib/fetcher";

export const inventoryApi = {
  async listVehicles(query: VehiclesListQueryDTO): Promise<VehiclesListResult> {
    const url = new URL(`${config.apiUrl}/inventory/vehicles`);
    url.searchParams.set("limit", String(query.limit ?? 20));
    url.searchParams.set("offset", String(query.offset ?? 0));
    if (query.sort) url.searchParams.set("sort", JSON.stringify(query.sort));
    if (query.filters)
      url.searchParams.set("filters", JSON.stringify(query.filters));
    if (query.status) url.searchParams.set("status", query.status);
    if (query.brandId) url.searchParams.set("brandId", query.brandId);
    if (query.modelId) url.searchParams.set("modelId", query.modelId);
    if (query.vehicleType)
      url.searchParams.set("vehicleType", query.vehicleType);
    if (query.registrationReady)
      url.searchParams.set("registrationReady", query.registrationReady);
    return fetcher.get<VehiclesListResult>(url.toString());
  },

  async getVehicleStatusHistory(
    id: string,
  ): Promise<VehicleStatusHistoryResult> {
    return fetcher.get<VehicleStatusHistoryResult>(
      `${config.apiUrl}/inventory/vehicles/${id}/status-history`,
    );
  },

  async getVehicle(id: string): Promise<VehicleDetailResult> {
    return fetcher.get<VehicleDetailResult>(
      `${config.apiUrl}/inventory/vehicles/${id}`,
    );
  },

  async create(input: CreateVehicleDTO): Promise<VehicleDetailResult> {
    return fetcher.post<VehicleDetailResult>(
      `${config.apiUrl}/inventory/vehicles`,
      input,
    );
  },

  async update(
    id: string,
    input: UpdateVehicleDTO,
  ): Promise<VehicleDetailResult> {
    return fetcher.put<VehicleDetailResult>(
      `${config.apiUrl}/inventory/vehicles/${id}`,
      input,
    );
  },

  async updateStatus(
    id: string,
    input: UpdateVehicleStatusDTO,
  ): Promise<VehicleDetailResult> {
    return fetcher.patch<VehicleDetailResult>(
      `${config.apiUrl}/inventory/vehicles/${id}/status`,
      input,
    );
  },

  async remove(id: string): Promise<{ id: string }> {
    return fetcher.delete<{ id: string }>(
      `${config.apiUrl}/inventory/vehicles/${id}`,
    );
  },

  async listBrands(): Promise<BrandsListResult> {
    return fetcher.get<BrandsListResult>(`${config.apiUrl}/inventory/brands`);
  },

  async listColors(): Promise<ColorsListResult> {
    return fetcher.get<ColorsListResult>(`${config.apiUrl}/inventory/colors`);
  },

  async listModels(query: ModelsListQueryDTO = {}): Promise<ModelsListResult> {
    const url = new URL(`${config.apiUrl}/inventory/models`);
    if (query.brandId) url.searchParams.set("brandId", query.brandId);
    return fetcher.get<ModelsListResult>(url.toString());
  },

  async updateDocumentStatus(
    id: string,
    input: UpdateVehicleDocumentStatusDTO,
  ): Promise<VehicleDetailResult> {
    return fetcher.patch<VehicleDetailResult>(
      `${config.apiUrl}/inventory/vehicles/${id}/document-status`,
      input,
    );
  },

  async addDocument(
    id: string,
    input: CreateVehicleDocumentDTO,
  ): Promise<VehicleDetailResult> {
    return fetcher.post<VehicleDetailResult>(
      `${config.apiUrl}/inventory/vehicles/${id}/documents`,
      input,
    );
  },

  async removeDocument(
    id: string,
    docId: string,
  ): Promise<VehicleDetailResult> {
    return fetcher.delete<VehicleDetailResult>(
      `${config.apiUrl}/inventory/vehicles/${id}/documents/${docId}`,
    );
  },
};
