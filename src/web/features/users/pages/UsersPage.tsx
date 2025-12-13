import type { OffsetPageQueryDTO } from "@/server/shared/contracts/base";
import { USER_ROLES } from "@/server/shared/contracts/user-roles";
import { Header } from "@/web/app/layout/Header";
import { Main } from "@/web/app/layout/Main";
import { Modal, toast } from "@devhop/ui";
import { useNavigate, useSearch } from "@tanstack/react-router";
// removed react-use to avoid dependency; useEffect with [] instead
import { config } from "@/web/shared/lib/config";

import { useDisclosure } from "../../../shared/hooks/useDisclosure";
import { useActionPermission } from "../../auth/model/useActionPermission";
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsersQuery,
} from "../api/queries";
import { UserForm } from "../ui/UserForm";
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
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const editModal = useDisclosure<{
    id: string;
    email: string;
    name: string;
    roleId: string;
    image?: string;
  }>();
  const updateUser = useUpdateUser(editModal.data?.id ?? "");
  const createModal = useDisclosure();

  // Filters are managed by UsersFilter component

  return (
    <>
      <Header />

      <Main>
        <UsersToolbar canManage={!!canManage} onCreate={createModal.open} />

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
              editModal.openWith({
                id: u.id,
                email: u.email,
                name: u.name ?? "",
                roleId: u.roleIds && u.roleIds.length > 0 ? u.roleIds[0] : "",
                image: u.image ? config.apiUrl + u.image : undefined,
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

        <Modal
          open={!!createModal.isOpen}
          onOpenChange={createModal.toggle}
          title="ສ້າງຜູ້ໃຊ້"
          size="sm"
        >
          <UserForm
            onSubmit={async (vals) => {
              await createUser.mutateAsync({
                ...vals,
                imageFile: vals.imageFile || undefined,
              });
              createModal.close();
            }}
            submitting={createUser.isPending}
          />
        </Modal>

        <Modal
          open={!!editModal.isOpen}
          onOpenChange={editModal.toggle}
          title="ແກ້ໄຂຜູ້ໃຊ້"
          size="sm"
        >
          <UserForm
            initialValues={editModal.data ?? undefined}
            onSubmit={async (vals) => {
              await updateUser.mutateAsync({
                ...vals,
                image: vals.image || undefined,
                imageFile: vals.imageFile,
              });
              editModal.close();
            }}
            submitting={updateUser.isPending}
          />
        </Modal>
      </Main>
    </>
  );
}
