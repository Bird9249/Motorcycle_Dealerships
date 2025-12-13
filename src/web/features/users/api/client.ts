import type {
  CreateUserFormDTO,
  UpdateUserFormDTO,
} from "@/server/modules/users/contracts";
import type {
  BanUserServiceResult,
  CreateUserServiceResult,
  DeleteUserServiceResult,
  UnbanUserServiceResult,
  UpdateUserServiceResult,
  UserByIdResult,
  UsersListResult,
} from "@/server/modules/users/types";
import type { OffsetPageQueryDTO } from "@/server/shared/contracts/base";
import { config } from "@/web/shared/lib/config";
import { fetcher } from "../../../shared/lib/fetcher";

function toFormData(input: Record<string, unknown>): FormData {
  const fd = new FormData();
  Object.entries(input).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (v instanceof File) fd.append(k, v);
    else fd.append(k, String(v));
  });
  return fd;
}

export const usersApi = {
  async list(query: OffsetPageQueryDTO): Promise<UsersListResult> {
    const url = new URL(`${config.apiUrl}/users`);
    url.searchParams.set("limit", String(query.limit ?? 20));
    url.searchParams.set("offset", String(query.offset ?? 0));
    if (query.sort) url.searchParams.set("sort", JSON.stringify(query.sort));
    if (query.filters)
      url.searchParams.set("filters", JSON.stringify(query.filters));
    return fetcher.get<UsersListResult>(url.toString());
  },
  async get(id: string): Promise<UserByIdResult> {
    return fetcher.get<UserByIdResult>(`${config.apiUrl}/users/${id}`);
  },
  async create(input: CreateUserFormDTO) {
    return fetcher.postForm<CreateUserServiceResult>(
      `${config.apiUrl}/users`,
      toFormData(input),
    );
  },
  async update(id: string, input: UpdateUserFormDTO) {
    return fetcher.putForm<UpdateUserServiceResult>(
      `${config.apiUrl}/users/${id}`,
      toFormData(input),
    );
  },
  async remove(id: string) {
    return fetcher.delete<DeleteUserServiceResult>(
      `${config.apiUrl}/users/${id}`,
    );
  },
  async ban(id: string, data: { reason?: string; expires?: string }) {
    return fetcher.post<BanUserServiceResult>(
      `${config.apiUrl}/users/${id}/ban`,
      data,
    );
  },
  async unban(id: string) {
    return fetcher.post<UnbanUserServiceResult>(
      `${config.apiUrl}/users/${id}/unban`,
    );
  },
};
