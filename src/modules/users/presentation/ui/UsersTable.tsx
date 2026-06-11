import { BanIcon, EditIcon, TrashIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  confirm,
  createSelectColumn,
  createSortableColumn,
  DataTable,
  Modal,
  type TanstackReactTable,
  toast,
} from "@/components/kit";
import { usePermissions } from "@/modules/auth/presentation/model/usePermissions";
import type { UsersListResult } from "@/modules/users/domain/types";
import { getInitials } from "@/shared/lib/utils";
import { resolveImageSrc } from "@/shared/ui/AppImage";
import { RowActions } from "@/shared/ui/RowActions";
import { useBanUser, useDeleteUser, useUnbanUser } from "../api/queries";
import { BanUserForm } from "./BanUserForm";
import { UsersBulkActions } from "./UsersBulkActions";

type UserRow = UsersListResult["data"][number];

type UsersTableProps = {
  data: UserRow[];
  isLoading?: boolean;
  offset: number;
  limit: number;
  totalCount: number;
  onPaginationChange: (offset: number, limit: number) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortingChange: (id: string, desc: boolean) => void;
  onEdit: (user: UserRow) => void;
  onDelete: (id: string) => void;
};

function isAdmin(row: UserRow) {
  return row.roles[0]?.name === "admin";
}

async function runBulk<T>(
  items: T[],
  action: (item: T) => Promise<void>,
): Promise<{ ok: number; failed: number }> {
  const results = await Promise.allSettled(items.map((item) => action(item)));
  const ok = results.filter((r) => r.status === "fulfilled").length;
  return { ok, failed: results.length - ok };
}

export function UsersTable({
  data,
  isLoading,
  offset,
  limit,
  totalCount,
  onPaginationChange,
  sortBy,
  sortOrder,
  onSortingChange,
  onEdit,
  onDelete,
}: UsersTableProps) {
  const { has } = usePermissions();

  const deleteUser = useDeleteUser();
  const ban = useBanUser();
  const unban = useUnbanUser();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionResetKey, setSelectionResetKey] = useState(0);
  const [bulkPending, setBulkPending] = useState(false);
  const [banModal, setBanModal] = useState<{ open: boolean; ids: string[] }>({
    open: false,
    ids: [],
  });

  const canDelete = has("users:delete");
  const canBan = has("users:ban");
  const enableSelection = canDelete || canBan;
  const canUpdate = has("users:update");

  const selectedUsers = useMemo(
    () => data.filter((row) => selectedIds.includes(row.id as string)),
    [data, selectedIds],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setSelectionResetKey((key) => key + 1);
  }, []);

  const runBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const ok = await confirm({
      title: "ລຶບຜູ້ໃຊ້ຫຼາຍຄັ້ງ",
      description: `ທ່ານແນ່ໃຈບໍ່ວ່າຈະລຶບ ${selectedIds.length} ຜູ້ໃຊ້ທີ່ເລືອກ?`,
      actionText: "ລຶບ",
      ActionProps: { variant: "destructive" },
    });
    if (!ok) return;

    setBulkPending(true);
    try {
      const { ok: success, failed } = await runBulk(selectedIds, (id) =>
        deleteUser.run(id),
      );
      if (failed === 0) {
        toast.success(`ລຶບ ${success} ຜູ້ໃຊ້ສໍາເລັດ`);
      } else {
        toast.error(`ລຶບສໍາເລັດ ${success} ຄົນ, ລົ້ມເຫຼວ ${failed} ຄົນ`);
      }
      clearSelection();
    } finally {
      setBulkPending(false);
    }
  };

  const runBulkUnban = async () => {
    const ids = selectedUsers
      .filter((u) => u.banned)
      .map((u) => u.id as string);
    if (ids.length === 0) {
      toast.error("ບໍ່ມີຜູ້ໃຊ້ທີ່ຖືກລະງັບໃນການເລືອກ");
      return;
    }
    const ok = await confirm({
      title: "ຍົກເລີກລະງັບຫຼາຍຄັ້ງ",
      description: `ອະນຸຍາດໃຫ້ ${ids.length} ຜູ້ໃຊ້ເຂົ້າໃຊ້ອີກຄັ້ງບໍ?`,
      actionText: "ຍົກເລີກລະງັບ",
    });
    if (!ok) return;

    setBulkPending(true);
    try {
      const { ok: success, failed } = await runBulk(ids, (id) => unban.run(id));
      if (failed === 0) {
        toast.success(`ຍົກເລີກລະງັບ ${success} ຜູ້ໃຊ້ສໍາເລັດ`);
      } else {
        toast.error(`ສໍາເລັດ ${success} ຄົນ, ລົ້ມເຫຼວ ${failed} ຄົນ`);
      }
      clearSelection();
    } finally {
      setBulkPending(false);
    }
  };

  const openBulkBan = () => {
    const ids = selectedUsers
      .filter((u) => !u.banned)
      .map((u) => u.id as string);
    if (ids.length === 0) {
      toast.error("ຜູ້ໃຊ້ທີ່ເລືອກຖືກລະງັບແຖວແລ້ວ");
      return;
    }
    setBanModal({ open: true, ids });
  };

  const columns: TanstackReactTable.ColumnDef<UserRow>[] = useMemo(
    () => [
      ...(enableSelection ? [createSelectColumn<UserRow>()] : []),
      {
        id: "avatar",
        header: "ຮູບ",
        cell: ({ row }: { row: { original: UserRow } }) => (
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={resolveImageSrc(row.original.image) ?? undefined}
              alt={row.original.name ?? "avatar"}
            />
            <AvatarFallback>
              {getInitials(row.original.name ?? "")}
            </AvatarFallback>
          </Avatar>
        ),
        size: 50,
      },
      createSortableColumn<UserRow>("email", "ອີເມວ", { size: 100 }),
      createSortableColumn<UserRow>("name", "ຊື່", { size: 100 }),
      {
        id: "banned",
        header: "ຖືກລະງັບ",
        cell: ({ row }) =>
          row.original.banned ? (
            <Badge variant="destructive">ຖືກລະງັບ</Badge>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          ),
        size: 50,
      },
      {
        id: "roles",
        header: "ບົດບາດ",
        cell: ({ row }) => {
          const names = (row.original.roles ?? [])
            .map((r: { name: string }) => r.name)
            .join(", ");
          return (
            <span className="text-muted-foreground text-sm">
              {names || "-"}
            </span>
          );
        },
        size: 50,
      },
      {
        size: 100,
        id: "actions",
        cell: ({ row }: { row: { original: UserRow } }) => {
          if (isAdmin(row.original)) return;

          const id = row.original.id as string;
          const actions: {
            label: string;
            icon?: React.ReactNode;
            variant?: "destructive";
            onClick: () => void;
          }[] = [];

          if (canUpdate)
            actions.push({
              label: "ແກ້ໄຂ",
              icon: <EditIcon className="h-4 w-4" />,
              onClick: () => onEdit(row.original),
            });

          if (canBan && row.original?.banned)
            actions.push({
              label: "ຍົກເລີກລະງັບ",
              icon: <BanIcon className="h-4 w-4" />,
              onClick: async () => {
                const ok = await confirm({
                  title: "ຍົກເລີກລະງັບຜູ້ໃຊ້",
                  description: "ອະນຸຍາດໃຫ້ຜູ້ໃຊ້ນີ້ເຂົ້າໃຊ້ອີກຄັ້ງບໍ?",
                  actionText: "ຍົກເລີກລະງັບ",
                  ActionProps: {
                    variant: "default",
                  },
                });

                if (ok)
                  toast.promise(unban.run(id), {
                    loading: "ກໍາລັງຍົກເລີກລະງັບ...",
                    success: "ຍົກເລີກລະງັບຜູ້ໃຊ້ສໍາເລັດ",
                    error: "ຍົກເລີກລະງັບຜູ້ໃຊ້ລົ້ມເຫຼວ",
                  });
              },
            });

          if (canBan && !row.original?.banned)
            actions.push({
              label: "ລະງັບ",
              icon: <BanIcon className="h-4 w-4" />,
              onClick: () => setBanModal({ open: true, ids: [id] }),
            });

          if (canDelete)
            actions.push({
              label: "ລຶບ",
              variant: "destructive",
              icon: <TrashIcon className="h-4 w-4" />,
              onClick: async () => {
                const ok = await confirm({
                  title: "ລຶບຜູ້ໃຊ້",
                  description: "ທ່ານແນ່ໃຈບໍ່ວ່າຈະລຶບຜູ້ໃຊ້ຄົນນີ້?",
                  actionText: "ລຶບ",
                  ActionProps: {
                    variant: "destructive",
                  },
                });
                if (ok) onDelete(id);
              },
            });

          return <RowActions actions={actions} maxInline={2} />;
        },
      },
    ],
    [canBan, canDelete, canUpdate, enableSelection, onDelete, onEdit, unban],
  );

  return (
    <>
      <div data-tourid="users-table">
        {enableSelection ? (
          <UsersBulkActions
            count={selectedIds.length}
            onClear={clearSelection}
            onDelete={canDelete ? runBulkDelete : undefined}
            onBan={canBan ? openBulkBan : undefined}
            onUnban={canBan ? runBulkUnban : undefined}
            isPending={bulkPending}
          />
        ) : null}

        <DataTable<UserRow, unknown>
          noDataMessage="ບໍ່ພົບຜູ້ໃຊ້"
          isLoading={isLoading}
          columns={columns}
          data={data}
          offset={offset}
          limit={limit}
          totalCount={totalCount}
          enableRowSelection={enableSelection}
          onSelectionChange={setSelectedIds}
          selectionResetKey={selectionResetKey}
          getRowId={(row) => row.id as string}
          getRowCanSelect={(row) => !isAdmin(row)}
          onPaginationChange={(p) => onPaginationChange(p.offset, p.limit)}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortingChange={(sorting) => {
            if (sorting[0]?.id === "") return;
            onSortingChange(sorting[0]?.id as string, !!sorting[0]?.desc);
          }}
        />
      </div>

      <Modal
        open={banModal.open}
        onOpenChange={(v) => {
          if (!v) setBanModal({ open: false, ids: [] });
          else setBanModal((prev) => ({ ...prev, open: true }));
        }}
        title={
          banModal.ids.length > 1
            ? `ລະງັບ ${banModal.ids.length} ຜູ້ໃຊ້`
            : "ລະງັບຜູ້ໃຊ້"
        }
        description="ໃສ່ເຫດຜົນແລະວັນໝົດອາຍຸ (ຖ້າມີ)"
        size="sm"
      >
        <BanUserForm
          submitting={ban.isPending || bulkPending}
          onSubmit={async (vals) => {
            if (banModal.ids.length === 0) return;
            setBulkPending(true);
            try {
              const { ok: success, failed } = await runBulk(
                banModal.ids,
                (id) => ban.run({ id, ...vals }),
              );
              if (failed === 0) {
                toast.success(`ລະງັບ ${success} ຜູ້ໃຊ້ສໍາເລັດ`);
              } else {
                toast.error(`ສໍາເລັດ ${success} ຄົນ, ລົ້ມເຫຼວ ${failed} ຄົນ`);
              }
              setBanModal({ open: false, ids: [] });
              clearSelection();
            } finally {
              setBulkPending(false);
            }
          }}
        />
      </Modal>
    </>
  );
}
