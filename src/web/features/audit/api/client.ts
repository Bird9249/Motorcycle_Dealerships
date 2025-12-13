import { config } from "@/web/shared/lib/config";
import { fetcher } from "@/web/shared/lib/fetcher";

export type SortDir = "asc" | "desc";
export type SortFieldDTO = { field: string; dir: SortDir };
export type FilterConditionDTO = {
  field: string;
  op:
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "contains"
    | "startsWith"
    | "endsWith"
    | "in"
    | "nin"
    | "between";
  value: string | number | boolean | string[] | number[] | [number, number];
};
export type OffsetPageQueryDTO = {
  limit: number;
  offset: number;
  sort?: SortFieldDTO[];
  filters?: (FilterConditionDTO | FilterConditionDTO[])[];
};
export type OffsetPageDTO<T> = {
  data: T[];
  meta: { total: number; limit: number; offset: number };
};

export type AuditItem = {
  id: string;
  occurredAt: string;
  action: string;
  tenantId?: string | null;
  requestId?: string | null;
  traceId?: string | null;
  actorId?: string | null;
  actorRole?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  result?: string | null;
  error?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  path?: string | null;
  method?: string | null;
};

export type AuditDetail = AuditItem & {
  before?: unknown;
  after?: unknown;
  meta?: Record<string, unknown> | null;
};

export async function fetchAudit(query: OffsetPageQueryDTO) {
  const params = new URLSearchParams();
  params.set("limit", String(query.limit ?? 20));
  params.set("offset", String(query.offset ?? 0));
  if (query.sort) params.set("sort", JSON.stringify(query.sort));
  if (query.filters) params.set("filters", JSON.stringify(query.filters));

  return fetcher.get<OffsetPageDTO<AuditItem>>(
    `${config.apiUrl}/audit?${params.toString()}`,
  );
}

export async function fetchAuditById(id: string) {
  return fetcher.get<{ item: AuditDetail }>(`${config.apiUrl}/audit/${id}`);
}
