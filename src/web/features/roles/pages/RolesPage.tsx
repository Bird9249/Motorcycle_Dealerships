import type { OffsetPageQueryDTO } from "@/server/shared/contracts/base";
import type { PermissionId } from "@/server/shared/contracts/permissions";
import { Header } from "@/web/app/layout/Header";
import { Main } from "@/web/app/layout/Main";
import { Modal, toast } from "@devhop/ui";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useDisclosure } from "../../../shared/hooks/useDisclosure";
import { useActionPermission } from "../../auth/model/useActionPermission";
import type { RoleDTO } from "../api/client";
import {
  useCreateRole,
  useDeleteRole,
  useRolesQuery,
  useUpdateRole,
} from "../api/queries";
import { RoleForm } from "../ui/RoleForm";
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
  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();
  const canManage = useActionPermission(["users:ban"]);

  const createModal = useDisclosure();
  const editModal = useDisclosure<RoleDTO>();
  const updateRole = useUpdateRole(editModal.data?.id ?? "");

  return (
    <>
      <Header />

      <Main>
        <RolesToolbar onCreate={() => createModal.open()} />

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
            onEdit={(role: RoleDTO) => editModal.openWith(role)}
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
      </Main>

      {/* Create */}
      <Modal
        open={!!createModal.isOpen}
        onOpenChange={createModal.toggle}
        title="ສ້າງບົດບາດ"
        description="ກໍານົດຊື່, ຄໍາອະທິບາຍ, ແລະສິດທິຂອງບົດບາດ."
        size="sm"
      >
        <RoleForm
          onSubmit={async (vals) => {
            await createRole.mutateAsync({
              name: vals.name ?? "",
              description: vals.description ?? null,
              permissions: vals.permissions as PermissionId[],
            });
            createModal.close();
          }}
          submitting={createRole.isPending}
        />
      </Modal>

      {/* Edit */}
      <Modal
        open={!!editModal.isOpen}
        onOpenChange={editModal.toggle}
        title="ແກ້ໄຂບົດບາດ"
        description="ປັບປຸງລາຍລະອຽດແລະສິດທິຂອງບົດບາດ."
        size="sm"
      >
        <RoleForm
          initialValues={
            editModal.data
              ? {
                  name: editModal.data.name,
                  description: editModal.data.description,
                  permissions: editModal.data.permissions,
                }
              : undefined
          }
          onSubmit={async (vals) => {
            await updateRole.mutateAsync(vals);
            editModal.close();
          }}
        />
      </Modal>
    </>
  );
}
