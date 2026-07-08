import type {
  CreateServiceRecordDTO,
  ExpiringWarrantiesQueryDTO,
  ServiceRecordListItemDTO,
  ServiceRecordsListQueryDTO,
  UpdateWarrantySettingsDTO,
  WarrantyListItemDTO,
  WarrantiesListQueryDTO,
  WarrantySettingsDTO,
} from "@/modules/after-sales/domain/contracts";
import type { OffsetPageDTO } from "@/shared/contracts/base";
import { config } from "@/shared/lib/config";
import { fetcher } from "@/shared/lib/fetcher";

function buildWarrantiesUrl(query: Partial<WarrantiesListQueryDTO>) {
  const url = new URL(`${config.apiUrl}/after-sales/warranties`);
  url.searchParams.set("limit", String(query.limit ?? 20));
  url.searchParams.set("offset", String(query.offset ?? 0));
  if (query.warrantyType) {
    url.searchParams.set("warrantyType", query.warrantyType);
  }
  if (query.status) url.searchParams.set("status", query.status);
  if (query.expiringSoon) {
    url.searchParams.set("expiringSoon", query.expiringSoon);
  }
  if (query.salesOrderId) {
    url.searchParams.set("salesOrderId", query.salesOrderId);
  }
  return url.toString();
}

export type WarrantyListItem = WarrantyListItemDTO;
export type ServiceRecordListItem = ServiceRecordListItemDTO;
export type ExpiringWarrantiesResult = {
  days: number;
  count: number;
  items: WarrantyListItem[];
};

export const afterSalesApi = {
  getWarrantySettings() {
    return fetcher.get<WarrantySettingsDTO>(
      `${config.apiUrl}/after-sales/warranty-settings`,
    );
  },

  updateWarrantySettings(input: UpdateWarrantySettingsDTO) {
    return fetcher.put<WarrantySettingsDTO>(
      `${config.apiUrl}/after-sales/warranty-settings`,
      input,
    );
  },

  listWarranties(query: Partial<WarrantiesListQueryDTO> = {}) {
    return fetcher.get<OffsetPageDTO<WarrantyListItem>>(
      buildWarrantiesUrl({
        limit: query.limit ?? 20,
        offset: query.offset ?? 0,
        warrantyType: query.warrantyType,
        status: query.status,
        expiringSoon: query.expiringSoon,
        salesOrderId: query.salesOrderId,
      }),
    );
  },

  listWarrantiesByOrder(salesOrderId: string) {
    return fetcher
      .get<OffsetPageDTO<WarrantyListItem>>(
        `${config.apiUrl}/after-sales/warranties?salesOrderId=${salesOrderId}&limit=100&offset=0`,
      )
      .then((res) => res.data);
  },

  getWarranty(id: string) {
    return fetcher.get<WarrantyListItem>(
      `${config.apiUrl}/after-sales/warranties/${id}`,
    );
  },

  listExpiringWarranties(query: Partial<ExpiringWarrantiesQueryDTO> = {}) {
    const url = new URL(`${config.apiUrl}/after-sales/warranties/expiring`);
    url.searchParams.set("days", String(query.days ?? 30));
    url.searchParams.set("limit", String(query.limit ?? 10));
    return fetcher.get<ExpiringWarrantiesResult>(url.toString());
  },

  listServiceRecords(query: Partial<ServiceRecordsListQueryDTO> = {}) {
    const url = new URL(`${config.apiUrl}/after-sales/service-records`);
    url.searchParams.set("limit", String(query.limit ?? 20));
    url.searchParams.set("offset", String(query.offset ?? 0));
    if (query.vehicleId) url.searchParams.set("vehicleId", query.vehicleId);
    if (query.customerId) url.searchParams.set("customerId", query.customerId);
    return fetcher.get<OffsetPageDTO<ServiceRecordListItem>>(url.toString());
  },

  getVehicleServiceHistory(vehicleId: string) {
    return fetcher.get<OffsetPageDTO<ServiceRecordListItem>>(
      `${config.apiUrl}/after-sales/vehicles/${vehicleId}/history`,
    );
  },

  createServiceRecord(input: CreateServiceRecordDTO) {
    return fetcher.post<ServiceRecordListItem>(
      `${config.apiUrl}/after-sales/service-records`,
      input,
    );
  },
};
