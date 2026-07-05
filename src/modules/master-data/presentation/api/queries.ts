import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/kit";
import type {
  BrandDTO,
  BrandsListQueryDTO,
  ColorDTO,
  ColorsListQueryDTO,
  CreateBrandDTO,
  CreateColorDTO,
  CreateModelDTO,
  ModelDTO,
  ModelsListQueryDTO,
  UpdateBrandDTO,
  UpdateColorDTO,
  UpdateModelDTO,
} from "@/modules/master-data/domain/contracts";
import { masterDataApi } from "./client";

const inventoryDropdownKey = ["inventory"] as const;

export const masterDataKeys = {
  all: ["master-data"] as const,
  brands: (q: BrandsListQueryDTO = {}) =>
    ["master-data", "brands", q] as const,
  brand: (id: string) => ["master-data", "brands", id] as const,
  models: (q: ModelsListQueryDTO = {}) =>
    ["master-data", "models", q] as const,
  model: (id: string) => ["master-data", "models", id] as const,
  colors: (q: ColorsListQueryDTO = {}) =>
    ["master-data", "colors", q] as const,
  color: (id: string) => ["master-data", "colors", id] as const,
};

export function useBrandsMasterQuery(query: BrandsListQueryDTO = {}) {
  return useQuery({
    queryKey: masterDataKeys.brands(query),
    queryFn: () => masterDataApi.listBrands(query),
  });
}

export function useBrandMasterQuery(id: string) {
  return useQuery({
    queryKey: masterDataKeys.brand(id),
    queryFn: () => masterDataApi.getBrand(id),
    enabled: !!id,
  });
}

export function useModelsMasterQuery(query: ModelsListQueryDTO = {}) {
  return useQuery({
    queryKey: masterDataKeys.models(query),
    queryFn: () => masterDataApi.listModels(query),
  });
}

export function useModelMasterQuery(id: string) {
  return useQuery({
    queryKey: masterDataKeys.model(id),
    queryFn: () => masterDataApi.getModel(id),
    enabled: !!id,
  });
}

export function useColorsMasterQuery(query: ColorsListQueryDTO = {}) {
  return useQuery({
    queryKey: masterDataKeys.colors(query),
    queryFn: () => masterDataApi.listColors(query),
  });
}

export function useColorMasterQuery(id: string) {
  return useQuery({
    queryKey: masterDataKeys.color(id),
    queryFn: () => masterDataApi.getColor(id),
    enabled: !!id,
  });
}

function invalidateMasterData(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: masterDataKeys.all });
  qc.invalidateQueries({ queryKey: inventoryDropdownKey });
}

function patchListStatus<T extends { id: string; isActive: boolean }>(
  qc: ReturnType<typeof useQueryClient>,
  entity: "brands" | "models" | "colors",
  id: string,
  isActive: boolean,
) {
  qc.setQueriesData<T[]>(
    { queryKey: ["master-data", entity] },
    (old) => old?.map((item) => (item.id === id ? { ...item, isActive } : item)),
  );
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBrandDTO) => masterDataApi.createBrand(input),
    onSuccess: () => {
      toast.success("ເພີ່ມຍີ່ຫໍ້ສໍາເລັດ");
      invalidateMasterData(qc);
    },
  });
}

export function useUpdateBrand(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBrandDTO) => masterDataApi.updateBrand(id, input),
    onSuccess: () => {
      toast.success("ແກ້ໄຂຍີ່ຫໍ້ສໍາເລັດ");
      qc.invalidateQueries({ queryKey: masterDataKeys.brand(id) });
      invalidateMasterData(qc);
    },
  });
}

export function useUpdateBrandStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      masterDataApi.updateBrandStatus(id, isActive),
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: masterDataKeys.all });
      const snapshots = qc
        .getQueriesData<BrandDTO[]>({ queryKey: ["master-data", "brands"] })
        .map(([key, data]) => ({ key, data }));
      patchListStatus<BrandDTO>(qc, "brands", id, isActive);
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(({ key, data }) => qc.setQueryData(key, data));
      toast.error("ປ່ຽນສະຖານະຍີ່ຫໍ້ລົ້ມເຫຼວ");
    },
    onSettled: () => invalidateMasterData(qc),
  });
}

export function useCreateModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateModelDTO) => masterDataApi.createModel(input),
    onSuccess: () => {
      toast.success("ເພີ່ມລຸ່ນສໍາເລັດ");
      invalidateMasterData(qc);
    },
  });
}

export function useUpdateModel(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateModelDTO) => masterDataApi.updateModel(id, input),
    onSuccess: () => {
      toast.success("ແກ້ໄຂລຸ່ນສໍາເລັດ");
      qc.invalidateQueries({ queryKey: masterDataKeys.model(id) });
      invalidateMasterData(qc);
    },
  });
}

export function useUpdateModelStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      masterDataApi.updateModelStatus(id, isActive),
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: masterDataKeys.all });
      const snapshots = qc
        .getQueriesData<ModelDTO[]>({ queryKey: ["master-data", "models"] })
        .map(([key, data]) => ({ key, data }));
      patchListStatus<ModelDTO>(qc, "models", id, isActive);
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(({ key, data }) => qc.setQueryData(key, data));
      toast.error("ປ່ຽນສະຖານະລຸ່ນລົ້ມເຫຼວ");
    },
    onSettled: () => invalidateMasterData(qc),
  });
}

export function useCreateColor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateColorDTO) => masterDataApi.createColor(input),
    onSuccess: () => {
      toast.success("ເພີ່ມສີສໍາເລັດ");
      invalidateMasterData(qc);
    },
  });
}

export function useUpdateColor(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateColorDTO) => masterDataApi.updateColor(id, input),
    onSuccess: () => {
      toast.success("ແກ້ໄຂສີສໍາເລັດ");
      qc.invalidateQueries({ queryKey: masterDataKeys.color(id) });
      invalidateMasterData(qc);
    },
  });
}

export function useUpdateColorStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      masterDataApi.updateColorStatus(id, isActive),
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: masterDataKeys.all });
      const snapshots = qc
        .getQueriesData<ColorDTO[]>({ queryKey: ["master-data", "colors"] })
        .map(([key, data]) => ({ key, data }));
      patchListStatus<ColorDTO>(qc, "colors", id, isActive);
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(({ key, data }) => qc.setQueryData(key, data));
      toast.error("ປ່ຽນສະຖານະສີລົ້ມເຫຼວ");
    },
    onSettled: () => invalidateMasterData(qc),
  });
}
