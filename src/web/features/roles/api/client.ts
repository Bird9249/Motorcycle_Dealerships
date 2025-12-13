import type {
  RoleCreateInput,
  RoleUpdateInput,
} from "@/server/modules/rbac/contracts";
import type {
  CreateRoleServiceResult,
  DeleteRoleServiceResult,
  RoleByIdResult,
  RolesListResult,
  UpdateRoleServiceResult,
} from "@/server/modules/rbac/types";
import type { OffsetPageQueryDTO } from "@/server/shared/contracts/base";
import { config } from "@/web/shared/lib/config";
import { fetchLookup, hydrateLookupItem } from "@/web/shared/lib/utils";
import { fetcher } from "../../../shared/lib/fetcher";

export type RoleDTO = RolesListResult["data"][number];

export const rolesApi = {
  async list(query: OffsetPageQueryDTO) {
    const url = new URL(`${config.apiUrl}/rbac/roles`);
    url.searchParams.set("limit", String(query.limit ?? 20));
    url.searchParams.set("offset", String(query.offset ?? 0));
    if (query.sort) url.searchParams.set("sort", JSON.stringify(query.sort));
    if (query.filters)
      url.searchParams.set("filters", JSON.stringify(query.filters));
    return fetcher.get<RolesListResult>(url.toString());
  },
  async get(id: string) {
    return fetcher.get<RoleByIdResult>(`${config.apiUrl}/rbac/roles/${id}`);
  },
  async create(input: RoleCreateInput) {
    return fetcher.post<CreateRoleServiceResult>(
      `${config.apiUrl}/rbac/roles`,
      input,
    );
  },
  async update(id: string, input: RoleUpdateInput) {
    return fetcher.patch<UpdateRoleServiceResult>(
      `${config.apiUrl}/rbac/roles/${id}`,
      input,
    );
  },
  async remove(id: string) {
    return fetcher.delete<DeleteRoleServiceResult>(
      `${config.apiUrl}/rbac/roles/${id}`,
    );
  },
  async lookup(params: {
    query: string;
    cursor?: string | null;
    pageSize: number;
  }) {
    return fetchLookup(`${config.apiUrl}/rbac/roles/lookup`, params);
  },
  async hydrate(id: string) {
    return hydrateLookupItem(`${config.apiUrl}/rbac/roles/lookup`, id);
  },
};
