import type {
  CreateMediaFormDTO,
  MediaLookupQueryDTO,
  UpdateMediaFormDTO,
} from "@/modules/media/domain/contracts";
import type {
  ArchiveMediaServiceResult,
  CreateMediaServiceResult,
  DeleteMediaServiceResult,
  MediaByIdResult,
  MediaListResult,
  UpdateMediaServiceResult,
} from "@/modules/media/domain/types";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { config } from "@/shared/lib/config";
import { fetcher } from "@/shared/lib/fetcher";

function toFormData(input: Record<string, unknown>): FormData {
  const fd = new FormData();
  Object.entries(input).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (v instanceof File) {
      fd.append(k, v);
    } else if (Array.isArray(v) && v.every((item) => item instanceof File)) {
      // สำหรับ multiple files
      v.forEach((file) => {
        fd.append(k, file);
      });
    } else {
      fd.append(k, String(v));
    }
  });
  return fd;
}

export const mediaApi = {
  async list(query: OffsetPageQueryDTO): Promise<MediaListResult> {
    const url = new URL(`${config.apiUrl}/media`);
    url.searchParams.set("limit", String(query.limit ?? 20));
    url.searchParams.set("offset", String(query.offset ?? 0));
    if (query.sort) url.searchParams.set("sort", JSON.stringify(query.sort));
    if (query.filters)
      url.searchParams.set("filters", JSON.stringify(query.filters));
    return fetcher.get<MediaListResult>(url.toString());
  },
  async get(id: string): Promise<{ item: MediaByIdResult }> {
    return fetcher.get<{ item: MediaByIdResult }>(
      `${config.apiUrl}/media/${id}`,
    );
  },
  async create(input: CreateMediaFormDTO) {
    return fetcher.postForm<{ items: CreateMediaServiceResult["value"] }>(
      `${config.apiUrl}/media`,
      toFormData(input),
    );
  },
  async update(id: string, input: UpdateMediaFormDTO) {
    return fetcher.putForm<{ item: UpdateMediaServiceResult["value"] }>(
      `${config.apiUrl}/media/${id}`,
      toFormData(input),
    );
  },
  async remove(id: string) {
    return fetcher.delete<DeleteMediaServiceResult>(
      `${config.apiUrl}/media/${id}`,
    );
  },
  async archive(id: string) {
    return fetcher.post<ArchiveMediaServiceResult>(
      `${config.apiUrl}/media/${id}/archive`,
    );
  },
  async unarchive(id: string) {
    return fetcher.post<ArchiveMediaServiceResult>(
      `${config.apiUrl}/media/${id}/unarchive`,
    );
  },
  async lookup(query: MediaLookupQueryDTO) {
    const url = new URL(`${config.apiUrl}/media/lookup`);
    if (query.q) url.searchParams.set("q", query.q);
    url.searchParams.set("limit", String(query.limit ?? 20));
    url.searchParams.set("skip", String(query.skip ?? 0));
    return fetcher.get<{
      items: Array<{
        id: string;
        name: string;
        fileUrl: string;
        thumbUrl: string | null;
      }>;
      total: number;
    }>(url.toString());
  },
  async lookupById(id: string) {
    return fetcher.get<{
      item: {
        id: string;
        name: string;
        fileUrl: string;
        thumbUrl: string | null;
      } | null;
    }>(`${config.apiUrl}/media/lookup/${id}`);
  },
};
