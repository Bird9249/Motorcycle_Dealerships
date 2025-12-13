import { fetcher } from "./fetcher";

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
};

export type LookupItem = { id: string; name: string };

export async function fetchLookup<T extends LookupItem>(
  url: string,
  {
    query,
    cursor,
    pageSize,
  }: { query: string; cursor?: string | null; pageSize: number },
): Promise<{ items: T[]; nextCursor: string | null; total: number }> {
  const page = cursor ? Number.parseInt(cursor, 10) : 1;
  const skip = (page - 1) * pageSize;

  const u = new URL(url);
  if (query && query.trim().length > 0) u.searchParams.set("q", query);
  u.searchParams.set("limit", String(pageSize));
  u.searchParams.set("skip", String(skip));

  const data = await fetcher.get<{
    items: T[];
    total?: number;
  }>(u.toString());
  const items = Array.isArray(data.items) ? data.items : [];
  const total = typeof data.total === "number" ? data.total : items.length;
  const nextCursor = skip + pageSize < total ? String(page + 1) : null;
  return { items, nextCursor, total };
}

// Adapter for InfiniteCombobox: expects `{ search, pageParam }` and returns `{ items, nextPage }`
export async function fetchLookupForInfinite<T extends LookupItem>(
  url: string,
  {
    search,
    pageParam,
  }: {
    search: string;
    pageParam: number;
  },
): Promise<{ items: T[]; nextPage: number | null }> {
  const limit = 20;
  const page = typeof pageParam === "number" && pageParam > 0 ? pageParam : 1;
  const skip = (page - 1) * limit;

  const u = new URL(url);
  if (search && search.trim().length > 0) u.searchParams.set("q", search);
  u.searchParams.set("limit", String(limit));
  u.searchParams.set("skip", String(skip));

  const data = await fetcher.get<{
    items: T[];
    total?: number;
  }>(u.toString());
  const items = Array.isArray(data.items) ? data.items : [];
  const total = typeof data.total === "number" ? data.total : items.length;
  const nextPage = skip + limit < total ? page + 1 : null;
  return { items, nextPage };
}

export async function hydrateLookupItem<T extends LookupItem>(
  url: string,
  id: string,
): Promise<T | null> {
  if (!id) return null;
  const data = await fetcher.get<{ item?: T | null }>(
    `${url}/${encodeURIComponent(id)}`,
  );
  return data.item ?? null;
}
