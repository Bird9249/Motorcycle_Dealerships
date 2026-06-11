import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/kit";
import type {
  CreateUserFormDTO,
  UpdateUserFormDTO,
} from "@/modules/users/domain/contracts";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { usersApi } from "./client";

export const usersKeys = {
  all: ["users"] as const,
  list: (q: Partial<OffsetPageQueryDTO>) => ["users", "list", q] as const,
  detail: (id: string) => ["users", "detail", id] as const,
};

export function useUsersQuery(query: Partial<OffsetPageQueryDTO> = {}) {
  const q: OffsetPageQueryDTO = {
    limit: query.limit ?? 20,
    offset: query.offset ?? 0,
    sort: query.sort,
    filters: query.filters,
  };
  return useQuery({
    queryKey: usersKeys.list(q),
    queryFn: () => usersApi.list(q),
  });
}

export function useUserQuery(id: string) {
  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => usersApi.get(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserFormDTO) => usersApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.all });
    },
    onError: () => toast.error("Failed to create user"),
  });
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserFormDTO) => usersApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.detail(id) });
      qc.invalidateQueries({ queryKey: usersKeys.all });
    },
    onError: () => toast.error("Failed to update user"),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  const base = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.all });
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

export function useBanUser() {
  const qc = useQueryClient();
  const base = useMutation({
    mutationFn: (args: { id: string; reason?: string; expires?: string }) =>
      usersApi.ban(args.id, { reason: args.reason, expires: args.expires }),
    onSuccess: () => {
      toast.success("User banned");
      qc.invalidateQueries({ queryKey: usersKeys.all });
    },
  });

  const run = (args: { id: string; reason?: string; expires?: string }) =>
    new Promise<void>((resolve, reject) => {
      base.mutate(args, {
        onSuccess: () => resolve(),
        onError: (e) => reject(e),
      });
    });

  return { ...base, run };
}

export function useUnbanUser() {
  const qc = useQueryClient();
  const base = useMutation({
    mutationFn: (id: string) => usersApi.unban(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.all });
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
