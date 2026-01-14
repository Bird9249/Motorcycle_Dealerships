import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import { USER_ROLES } from "@/modules/roles/domain/contracts/user-roles";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { toast } from "@devhop/ui";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useDeleteUser, useUsersQuery } from "../api/queries";
import { UsersTour, useUsersTour } from "../tour";
import { UsersFilter } from "../ui/UsersFilter";
import { UsersTable } from "../ui/UsersTable";
import { UsersToolbar } from "../ui/UsersToolbar";

export function UsersPage() {
  const nav = useNavigate({ from: "/app/users" });
  const search: OffsetPageQueryDTO = useSearch({ from: "/app/users" });

  const list = useUsersQuery({
    offset: search.offset,
    limit: search.limit,
    sort: search.sort,
    filters: search.filters,
  });
  const userRoles = Object.values(USER_ROLES);

  const canManage = useActionPermission(["users:create"]);
  const deleteUser = useDeleteUser();
  const { run, handleJoyrideCallback, startTour } = useUsersTour();

  return (
    <>
      <Header />

      <Main>
        <UsersToolbar
          canManage={!!canManage}
          onCreate={() => nav({ to: "/app/users/create" })}
          onStartTour={startTour}
        />

        <div className="flex flex-col rounded-xl border bg-card pt-2">
          <UsersFilter roles={userRoles} />

          <UsersTable
            data={list.data?.data ?? []}
            isLoading={list.isLoading}
            offset={search.offset ?? 0}
            limit={search.limit ?? 20}
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
            onEdit={(u) =>
              nav({
                to: "/app/users/$id/edit",
                params: { id: u.id as string },
              })
            }
            onDelete={async (id) =>
              toast.promise(deleteUser.run(id), {
                loading: "ກໍາລັງລຶບ...",
                success: "ລຶບຜູ້ໃຊ້ສໍາເລັດ",
                error: "ລຶບຜູ້ໃຊ້ລົ້ມເຫຼວ",
              })
            }
          />
        </div>

        <UsersTour run={run} onCallback={handleJoyrideCallback} />
      </Main>
    </>
  );
}
