import { useNavigate, useSearch } from "@tanstack/react-router";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import type { SalesOrdersListQueryDTO } from "@/modules/sales/domain/contracts";
import { useSalesOrdersQuery } from "../api/queries";
import { SalesFilter } from "../ui/SalesFilter";
import { SalesTable } from "../ui/SalesTable";
import { SalesToolbar } from "../ui/SalesToolbar";

export function SalesPage() {
  const nav = useNavigate({ from: "/app/sales" });
  const search = useSearch({ from: "/app/sales" }) as SalesOrdersListQueryDTO;

  const list = useSalesOrdersQuery({
    offset: search.offset,
    limit: search.limit,
    sort: search.sort,
    filters: search.filters,
    status: search.status,
    paymentType: search.paymentType,
    dateField: search.dateField,
    dateFrom: search.dateFrom,
    dateTo: search.dateTo,
  });

  const canCreate = useActionPermission(["sales:create"]);

  return (
    <>
      <Header />
      <Main>
        <SalesToolbar
          canCreate={!!canCreate}
          totalCount={list.data?.meta?.total}
          isLoading={list.isLoading}
          onCreate={() => nav({ to: "/app/sales/new" })}
        />

        <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <SalesFilter />
          <SalesTable
            data={list.data?.data ?? []}
            isLoading={list.isLoading}
            offset={Number(search.offset ?? 0)}
            limit={Number(search.limit ?? 20)}
            totalCount={list.data?.meta?.total ?? 0}
            onPaginationChange={(offset, limit) =>
              nav({ search: { ...search, offset, limit } })
            }
            sortBy={search.sort ? search.sort[0]?.field : undefined}
            sortOrder={
              search.sort ? (search.sort[0]?.dir as "asc" | "desc") : undefined
            }
            onSortingChange={(id, desc) =>
              nav({
                search: {
                  ...search,
                  sort: [{ field: id, dir: desc ? "desc" : "asc" }],
                },
              })
            }
            onView={(order) =>
              nav({ to: "/app/sales/$id", params: { id: order.id } })
            }
            onEdit={(order) =>
              nav({ to: "/app/sales/$id/edit", params: { id: order.id } })
            }
          />
        </div>
      </Main>
    </>
  );
}
