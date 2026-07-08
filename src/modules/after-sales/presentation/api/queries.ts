import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/kit";
import type {
  CreateServiceRecordDTO,
  ExpiringWarrantiesQueryDTO,
  ServiceRecordsListQueryDTO,
  UpdateWarrantySettingsDTO,
  WarrantiesListQueryDTO,
} from "@/modules/after-sales/domain/contracts";
import { afterSalesApi } from "./client";

export const afterSalesKeys = {
  all: ["after-sales"] as const,
  warrantySettings: ["after-sales", "warranty-settings"] as const,
  warranties: (q: Partial<WarrantiesListQueryDTO>) =>
    ["after-sales", "warranties", q] as const,
  warranty: (id: string) => ["after-sales", "warranty", id] as const,
  expiring: (q: Partial<ExpiringWarrantiesQueryDTO>) =>
    ["after-sales", "warranties", "expiring", q] as const,
  serviceRecords: (q: Partial<ServiceRecordsListQueryDTO>) =>
    ["after-sales", "service-records", q] as const,
  vehicleServiceHistory: (vehicleId: string) =>
    ["after-sales", "service-records", "vehicle", vehicleId] as const,
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "ມີຂໍ້ຜິດພາດ";
}

export function useWarrantySettingsQuery() {
  return useQuery({
    queryKey: afterSalesKeys.warrantySettings,
    queryFn: () => afterSalesApi.getWarrantySettings(),
  });
}

export function useUpdateWarrantySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateWarrantySettingsDTO) =>
      afterSalesApi.updateWarrantySettings(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: afterSalesKeys.warrantySettings });
      toast.success("ບັນທຶກການຕັ້ງຄ່າປະກັນສຳເລັດ");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useWarrantiesQuery(query: Partial<WarrantiesListQueryDTO> = {}) {
  const q: WarrantiesListQueryDTO = {
    limit: query.limit ?? 20,
    offset: query.offset ?? 0,
    warrantyType: query.warrantyType,
    status: query.status,
    expiringSoon: query.expiringSoon,
    salesOrderId: query.salesOrderId,
  };
  return useQuery({
    queryKey: afterSalesKeys.warranties(q),
    queryFn: () => afterSalesApi.listWarranties(q),
  });
}

export function useWarrantyQuery(id: string) {
  return useQuery({
    queryKey: afterSalesKeys.warranty(id),
    queryFn: () => afterSalesApi.getWarranty(id),
    enabled: !!id,
  });
}

export function useExpiringWarrantiesQuery(
  query: Partial<ExpiringWarrantiesQueryDTO> = {},
) {
  const q: ExpiringWarrantiesQueryDTO = {
    days: query.days ?? 30,
    limit: query.limit ?? 10,
  };
  return useQuery({
    queryKey: afterSalesKeys.expiring(q),
    queryFn: () => afterSalesApi.listExpiringWarranties(q),
  });
}

export function useServiceRecordsQuery(
  query: Partial<ServiceRecordsListQueryDTO> = {},
  enabled = true,
) {
  const q: ServiceRecordsListQueryDTO = {
    limit: query.limit ?? 20,
    offset: query.offset ?? 0,
    vehicleId: query.vehicleId,
    customerId: query.customerId,
  };
  return useQuery({
    queryKey: afterSalesKeys.serviceRecords(q),
    queryFn: () => afterSalesApi.listServiceRecords(q),
    enabled,
  });
}

export function useVehicleServiceHistoryQuery(vehicleId: string) {
  return useQuery({
    queryKey: afterSalesKeys.vehicleServiceHistory(vehicleId),
    queryFn: () => afterSalesApi.getVehicleServiceHistory(vehicleId),
    enabled: !!vehicleId,
  });
}

export function useCreateServiceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateServiceRecordDTO) =>
      afterSalesApi.createServiceRecord(input),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: afterSalesKeys.all });
      toast.success("ບັນທຶກເຂົ້າບໍລິການສຳເລັດ");
      return created;
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
