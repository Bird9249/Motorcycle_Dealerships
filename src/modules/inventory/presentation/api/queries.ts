import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/kit";
import type {
  CreateVehicleDTO,
  CreateVehicleDocumentDTO,
  ModelsListQueryDTO,
  UpdateVehicleDocumentStatusDTO,
  UpdateVehicleDTO,
  UpdateVehicleStatusDTO,
  VehiclesListQueryDTO,
} from "@/modules/inventory/domain/contracts";
import { inventoryApi } from "./client";

export const inventoryKeys = {
  all: ["inventory"] as const,
  vehicles: (q: Partial<VehiclesListQueryDTO>) =>
    ["inventory", "vehicles", q] as const,
  vehicle: (id: string) => ["inventory", "vehicle", id] as const,
  vehicleStatusHistory: (id: string) =>
    ["inventory", "vehicle", id, "status-history"] as const,
  brands: ["inventory", "brands"] as const,
  colors: ["inventory", "colors"] as const,
  models: (q: ModelsListQueryDTO) => ["inventory", "models", q] as const,
};

export function useVehiclesQuery(query: Partial<VehiclesListQueryDTO> = {}) {
  const q: VehiclesListQueryDTO = {
    limit: query.limit ?? 20,
    offset: query.offset ?? 0,
    sort: query.sort,
    filters: query.filters,
    status: query.status,
    brandId: query.brandId,
    modelId: query.modelId,
    vehicleType: query.vehicleType,
    registrationReady: query.registrationReady,
  };
  return useQuery({
    queryKey: inventoryKeys.vehicles(q),
    queryFn: () => inventoryApi.listVehicles(q),
  });
}

export function useVehicleQuery(id: string) {
  return useQuery({
    queryKey: inventoryKeys.vehicle(id),
    queryFn: () => inventoryApi.getVehicle(id),
    enabled: !!id,
  });
}

export function useVehicleStatusHistoryQuery(id: string) {
  return useQuery({
    queryKey: inventoryKeys.vehicleStatusHistory(id),
    queryFn: () => inventoryApi.getVehicleStatusHistory(id),
    enabled: !!id,
  });
}

export function useBrandsQuery() {
  return useQuery({
    queryKey: inventoryKeys.brands,
    queryFn: () => inventoryApi.listBrands(),
  });
}

export function useColorsQuery() {
  return useQuery({
    queryKey: inventoryKeys.colors,
    queryFn: () => inventoryApi.listColors(),
  });
}

export function useModelsQuery(query: ModelsListQueryDTO = {}) {
  return useQuery({
    queryKey: inventoryKeys.models(query),
    queryFn: () => inventoryApi.listModels(query),
  });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "ມີຂໍ້ຜິດພາດ";
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVehicleDTO) => inventoryApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateVehicle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateVehicleDTO) => inventoryApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.vehicle(id) });
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateVehicleStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateVehicleStatusDTO) =>
      inventoryApi.updateStatus(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.vehicle(id) });
      qc.invalidateQueries({ queryKey: inventoryKeys.vehicleStatusHistory(id) });
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  const base = useMutation({
    mutationFn: (id: string) => inventoryApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const run = (id: string) =>
    new Promise<void>((resolve, reject) => {
      base.mutate(id, {
        onSuccess: () => resolve(),
        onError: (e) => reject(e),
      });
    });

  return { ...base, run };
}

export function useUpdateDocumentStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateVehicleDocumentStatusDTO) =>
      inventoryApi.updateDocumentStatus(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.vehicle(id) });
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useAddVehicleDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVehicleDocumentDTO) =>
      inventoryApi.addDocument(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.vehicle(id) });
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteVehicleDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) => inventoryApi.removeDocument(id, docId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.vehicle(id) });
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
