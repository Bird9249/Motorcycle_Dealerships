import { useNavigate, useSearch } from "@tanstack/react-router";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import type { VehiclesListQueryDTO } from "@/modules/inventory/domain/contracts";
import { useVehiclesQuery } from "../api/queries";
import { VehiclesFilter } from "../ui/VehiclesFilter";
import { VehiclesTable } from "../ui/VehiclesTable";
import { VehiclesToolbar } from "../ui/VehiclesToolbar";

export function VehiclesPage() {
  const nav = useNavigate({ from: "/app/inventory/vehicles" });
  const search = useSearch({
    from: "/app/inventory/vehicles",
  }) as VehiclesListQueryDTO;

  const list = useVehiclesQuery({
    offset: search.offset,
    limit: search.limit,
    sort: search.sort,
    filters: search.filters,
    status: search.status,
    brandId: search.brandId,
    modelId: search.modelId,
    vehicleType: search.vehicleType,
    registrationReady: search.registrationReady,
  });

  const canCreate = useActionPermission(["inventory:create"]);

  return (
    <>
      <Header />

      <Main>
        <VehiclesToolbar
          canCreate={!!canCreate}
          totalCount={list.data?.meta?.total}
          isLoading={list.isLoading}
          onCreate={() => nav({ to: "/app/inventory/vehicles/new" })}
        />

        <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <VehiclesFilter />

          <VehiclesTable
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
            onEdit={(vehicle) =>
              nav({
                to: "/app/inventory/vehicles/$id/edit",
                params: { id: vehicle.id },
              })
            }
            onView={(vehicle) =>
              nav({
                to: "/app/inventory/vehicles/$id",
                params: { id: vehicle.id },
              })
            }
          />
        </div>
      </Main>
    </>
  );
}
