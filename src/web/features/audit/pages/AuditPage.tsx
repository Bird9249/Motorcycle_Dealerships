import { Header } from "@/web/app/layout/Header";
import { Main } from "@/web/app/layout/Main";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo } from "react";
import type { OffsetPageQueryDTO } from "../api/client";
import { useAuditList } from "../api/queries";
import { AuditFilter } from "../ui/AuditFilter";
import { AuditTable } from "../ui/AuditTable";
import { AuditToolbar } from "../ui/AuditToolbar";

export function AuditPage() {
  const nav = useNavigate({ from: "/app/audit" });
  const search = useSearch({ from: "/app/audit" }) as OffsetPageQueryDTO;
  const query = useMemo<OffsetPageQueryDTO>(
    () => ({
      limit: search.limit ?? 20,
      offset: search.offset ?? 0,
      sort: search.sort,
      filters: search.filters,
    }),
    [search.limit, search.offset, search.sort, search.filters],
  );
  const { data, isLoading } = useAuditList(query);

  const items = data?.data ?? [];
  const total = data?.meta.total ?? 0;

  return (
    <>
      <Header />

      <Main>
        <AuditToolbar />
        <div className="flex flex-col rounded-xl border bg-card pt-2">
          <AuditFilter />
          <AuditTable
            isLoading={isLoading}
            data={items}
            offset={search.offset ?? 0}
            limit={search.limit ?? 20}
            totalCount={total}
            sortBy={search.sort ? search.sort[0]?.field : undefined}
            sortOrder={search.sort ? search.sort[0]?.dir : undefined}
            onPaginationChange={(offset, limit) =>
              nav({ search: { ...search, offset, limit } })
            }
            onSortingChange={(id, desc) =>
              nav({
                search: {
                  ...search,
                  sort: [{ field: id, dir: desc ? "desc" : "asc" }],
                },
              })
            }
            onView={(id) => {
              nav({
                to: "/app/audit/$id",
                params: { id },
                search: { ...search },
              });
            }}
          />
        </div>
      </Main>
    </>
  );
}
