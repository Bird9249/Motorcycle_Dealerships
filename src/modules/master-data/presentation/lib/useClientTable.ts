import { useMemo, useState } from "react";

type SortOrder = "asc" | "desc";

export function useClientTable<T extends Record<string, unknown>>(
  rows: T[],
  defaultSortKey: keyof T & string,
) {
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState(defaultSortKey);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), "lo");
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortBy, sortOrder]);

  const page = useMemo(
    () => sorted.slice(offset, offset + limit),
    [sorted, offset, limit],
  );

  return {
    page,
    totalCount: rows.length,
    offset,
    limit,
    sortBy,
    sortOrder,
    onPaginationChange: (nextOffset: number, nextLimit: number) => {
      setOffset(nextOffset);
      setLimit(nextLimit);
    },
    onSortingChange: (id: string, desc: boolean) => {
      setSortBy(id);
      setSortOrder(desc ? "desc" : "asc");
      setOffset(0);
    },
    resetPage: () => setOffset(0),
  };
}
