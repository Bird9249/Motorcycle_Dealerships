import { usePermissions } from "@/modules/auth/presentation/model/usePermissions";
import type { UsersListResult } from "@/modules/users/domain/types";
import { config } from "@/shared/lib/config";
import { getInitials } from "@/shared/lib/utils";
import { RowActions } from "@/shared/ui/RowActions";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  DataTable,
  Modal,
  confirm,
  createSortableColumn,
  toast,
  type TanstackReactTable,
} from "@devhop/ui";
import { BanIcon, EditIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { useBanUser, useUnbanUser } from "../api/queries";
import { BanUserForm } from "./BanUserForm";

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

  const ban = useBanUser();
  const unban = useUnbanUser();
  const [banModal, setBanModal] = useState<{ open: boolean; id?: string }>({
    open: false,
  });
  const columns: TanstackReactTable.ColumnDef<UserRow>[] = [
    // createSortableColumn<UserDTO>("id", "ID"),
    {
      id: "avatar",
      header: "ຮູບ",
      cell: ({ row }: { row: { original: UserRow } }) => (
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={
              row.original.image
                ? config.apiUrl + row.original.image
                : undefined
            }
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
          <span className="text-muted-foreground text-sm">{names || "-"}</span>
        );
      },
      size: 50,
    },
    {
      size: 100,
      id: "actions",
      cell: ({ row }: { row: { original: UserRow } }) => {
        if (row.original.roles[0]?.name === "admin") return;

        const id = row.original.id as string;
        const actions: {
          label: string;
          icon?: React.ReactNode;
          variant?: "destructive";
          onClick: () => void;
        }[] = [];

        if (has("users:update"))
          actions.push({
            label: "ແກ້ໄຂ",
            icon: <EditIcon className="h-4 w-4" />,
            onClick: () => onEdit(row.original),
          });

        if (has("users:ban") && row.original?.banned)
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

        if (has("users:ban") && !row.original?.banned)
          actions.push({
            label: "ລະງັບ",
            icon: <BanIcon className="h-4 w-4" />,
            onClick: () => setBanModal({ open: true, id }),
          });

        if (has("users:delete"))
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
  ];

  return (
    <>
      <div data-tourid="users-table">
        <DataTable<UserRow, unknown>
          noDataMessage="ບໍ່ພົບຜູ້ໃຊ້"
          isLoading={isLoading}
          columns={columns}
          data={data}
          offset={offset}
          limit={limit}
          totalCount={totalCount}
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
          if (!v) setBanModal({ open: false });
          else setBanModal({ open: true, id: banModal.id });
        }}
        title="ລະງັບຜູ້ໃຊ້"
        description="ໃສ່ເຫດຜົນແລະວັນໝົດອາຍຸ (ຖ້າມີ)"
        size="sm"
      >
        <BanUserForm
          submitting={ban.isPending}
          onSubmit={async (vals) => {
            if (!banModal.id) return;
            await ban.mutateAsync({ id: banModal.id, ...vals });
            setBanModal({ open: false });
          }}
        />
      </Modal>
    </>
  );
}
