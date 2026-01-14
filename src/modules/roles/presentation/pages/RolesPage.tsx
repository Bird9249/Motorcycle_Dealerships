import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { toast } from "@devhop/ui";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useDeleteRole, useRolesQuery } from "../api/queries";
import { RolesTour, useRolesTour } from "../tour";
import { RolesFilter } from "../ui/RolesFilter";
import { RolesTable } from "../ui/RolesTable";
import { RolesToolbar } from "../ui/RolesToolbar";

export function RolesPage() {
  const nav = useNavigate({ from: "/app/roles" });
  const search: OffsetPageQueryDTO & { search: string } = useSearch({
    from: "/app/roles",
  });

  const list = useRolesQuery({
    offset: search.offset,
    limit: search.limit,
    sort: search.sort,
    filters: search.filters,
  });
  const deleteRole = useDeleteRole();
  const canManage = useActionPermission(["users:ban"]);
  const { run, handleJoyrideCallback, startTour } = useRolesTour();

  return (
    <>
      <Header />

      <Main>
        <RolesToolbar
          onCreate={() => nav({ to: "/app/roles/create" })}
          onStartTour={startTour}
        />

        <div className="flex flex-col rounded-xl border bg-card pt-2">
          <RolesFilter />

          <RolesTable
            canManage={canManage}
            isLoading={list.isLoading}
            data={list.data?.data ?? []}
            offset={search.offset ?? 0}
            limit={search.limit ?? 20}
            totalCount={list.data?.meta?.total ?? 0}
            sortBy={search.sort ? search.sort[0]?.field : undefined}
            sortOrder={search.sort ? search.sort[0]?.dir : undefined}
            onEdit={(role) =>
              nav({
                to: "/app/roles/$id/edit",
                params: { id: role.id as string },
              })
            }
            onDelete={async (id: string) => {
              toast.promise(deleteRole.run(id), {
                loading: "ກໍາລັງລຶບ...",
                success: "ລຶບບົດບາດສໍາເລັດ",
                error: "ລຶບບົດບາດລົ້ມເຫຼວ",
              });
            }}
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
          />
        </div>

        <RolesTour run={run} onCallback={handleJoyrideCallback} />
      </Main>
    </>
  );
}
