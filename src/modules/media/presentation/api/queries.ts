import { toast } from "@devhop/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateMediaFormDTO,
  MediaLookupQueryDTO,
  UpdateMediaFormDTO,
} from "@/modules/media/domain/contracts";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { mediaApi } from "./client";

export const mediaKeys = {
  all: ["media"] as const,
  list: (q: Partial<OffsetPageQueryDTO>) => ["media", "list", q] as const,
  detail: (id: string) => ["media", "detail", id] as const,
  lookup: (q: Partial<MediaLookupQueryDTO>) => ["media", "lookup", q] as const,
};

export function useMediaQuery(query: Partial<OffsetPageQueryDTO> = {}) {
  const q: OffsetPageQueryDTO = {
    limit: query.limit ?? 20,
    offset: query.offset ?? 0,
    sort: query.sort,
    filters: query.filters,
  };
  return useQuery({
    queryKey: mediaKeys.list(q),
    queryFn: () => mediaApi.list(q),
  });
}

export function useMediaQueryById(id: string) {
  return useQuery({
    queryKey: mediaKeys.detail(id),
    queryFn: () => mediaApi.get(id),
    enabled: !!id,
  });
}

export function useCreateMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMediaFormDTO) => mediaApi.create(input),
    onSuccess: () => {
      toast.success("Media uploaded");
      qc.invalidateQueries({ queryKey: mediaKeys.all });
    },
    onError: () => toast.error("Failed to upload media"),
  });
}

export function useUpdateMedia(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      altText?: string | null;
      fileName?: string | null;
      file?: File | null;
    }) => {
      // Create object matching UpdateMediaFormDTO structure
      const payload: UpdateMediaFormDTO = {
        altText: input.altText ?? undefined,
        fileName: input.fileName ?? undefined,
        file: input.file ?? undefined,
      };
      return mediaApi.update(id, payload);
    },
    onSuccess: () => {
      toast.success("Media updated");
      qc.invalidateQueries({ queryKey: mediaKeys.detail(id) });
      qc.invalidateQueries({ queryKey: mediaKeys.all });
    },
    onError: () => toast.error("Failed to update media"),
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  const base = useMutation({
    mutationFn: (id: string) => mediaApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mediaKeys.all });
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

export function useArchiveMedia() {
  const qc = useQueryClient();
  const base = useMutation({
    mutationFn: (id: string) => mediaApi.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mediaKeys.all });
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

export function useUnarchiveMedia() {
  const qc = useQueryClient();
  const base = useMutation({
    mutationFn: (id: string) => mediaApi.unarchive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mediaKeys.all });
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
