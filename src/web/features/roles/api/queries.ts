import type {
  RoleCreateInput,
  RoleUpdateInput,
} from "@/server/modules/rbac/contracts";
import type { OffsetPageQueryDTO } from "@/server/shared/contracts/base";
import { toast } from "@devhop/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rolesApi } from "./client";

export const rolesKeys = {
  all: ["roles"] as const,
  list: (q: Partial<OffsetPageQueryDTO>) => ["roles", "list", q] as const,
  detail: (id: string) => ["roles", "detail", id] as const,
};

export function useRolesQuery(query: Partial<OffsetPageQueryDTO> = {}) {
  const q: OffsetPageQueryDTO = {
    limit: query.limit ?? 20,
    offset: query.offset ?? 0,
    sort: query.sort,
    filters: query.filters,
  };
  return useQuery({
    queryKey: rolesKeys.list(q),
    queryFn: () => rolesApi.list(q),
  });
}

export function useRoleQuery(id: string) {
  return useQuery({
    queryKey: rolesKeys.detail(id),
    queryFn: () => rolesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RoleCreateInput) => rolesApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rolesKeys.all });
      toast.success("Role created", {
        description: "Role created successfully",
      });
    },
  });
}

export function useUpdateRole(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RoleUpdateInput) => rolesApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rolesKeys.detail(id) });
      qc.invalidateQueries({ queryKey: rolesKeys.all });
      toast.success("Role updated", {
        description: "Role updated successfully",
      });
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  const base = useMutation({
    mutationFn: (id: string) => rolesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rolesKeys.all });
    },
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
