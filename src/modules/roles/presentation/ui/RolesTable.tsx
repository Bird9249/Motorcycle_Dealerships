import {
  getPermissionLabel,
  type PermissionId,
} from "@/modules/roles/domain/contracts/permissions";
import { RowActions } from "@/shared/ui/RowActions";
import {
  confirm,
  createExpandableColumn,
  createSortableColumn,
  DataTable,
  type TanstackReactTable,
} from "@devhop/ui";
import { EditIcon, TrashIcon } from "lucide-react";
import type { RoleDTO } from "../api/client";

type RolesTableProps = {
  canManage: boolean;
  isLoading: boolean;
  data: RoleDTO[];
  offset: number;
  limit: number;
  totalCount: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onEdit: (role: RoleDTO) => void;
  onDelete: (id: string) => Promise<void>;
  onPaginationChange: (offset: number, limit: number) => void;
  onSortingChange: (id: string, desc: boolean) => void;
};

export function RolesTable({
  canManage,
  isLoading,
  data,
  offset,
  limit,
  totalCount,
  sortBy,
  sortOrder,
  onEdit,
  onDelete,
  onPaginationChange,
  onSortingChange,
}: RolesTableProps) {
  const columns: TanstackReactTable.ColumnDef<RoleDTO>[] = [
    createExpandableColumn<RoleDTO>(""),
    createSortableColumn<RoleDTO>("name", "ຊື່", { size: 100 }),
    {
      id: "permissions",
      header: "ສິດທິ",
      cell: ({ row }) => {
        const labels = (row.original.permissions ?? []).map((p) =>
          getPermissionLabel(p as PermissionId),
        );
        return (
          <div className="max-w-[360px] truncate text-xs">
            {labels.join(", ")}
          </div>
        );
      },
      size: 100,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const id = row.original.id as string;
        if (!canManage) return null;
        const actions = [
          {
            label: "ແກ້ໄຂ",
            icon: <EditIcon className="h-4 w-4" />,
            onClick: () => onEdit(row.original),
          },
          {
            label: "ລຶບ",
            variant: "destructive" as const,
            icon: <TrashIcon className="h-4 w-4" />,
            onClick: async () => {
              const ok = await confirm({
                title: "ລຶບບົດບາດ",
                description: "ທ່ານແນ່ໃຈບໍ່ວ່າຈະລຶບບົດບາດນີ້?",
                actionText: "ລຶບ",
                ActionProps: {
                  variant: "destructive",
                },
              });
              if (ok) await onDelete(id);
            },
          },
        ];
        return <RowActions actions={actions} maxInline={2} />;
      },
      size: 100,
    },
  ];

  return (
    <div data-tourid="roles-table">
      <DataTable<RoleDTO, unknown>
        noDataMessage="ບໍ່ພົບບົດບາດ"
        isLoading={isLoading}
        columns={columns}
        data={data}
        offset={offset}
        limit={limit}
        totalCount={totalCount}
        onPaginationChange={(pagination) =>
          onPaginationChange(pagination.offset, pagination.limit)
        }
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortingChange={(sorting) => {
          if (sorting[0]?.id === "") return;
          onSortingChange(sorting[0]?.id as string, !!sorting[0]?.desc);
        }}
        renderExpandedContent={({ original }) => {
          return (
            <div className="space-y-4 rounded-lg bg-muted/50 p-4">
              <div>
                <h4 className="mb-2 font-medium text-sm">ຄໍາອະທິບາຍ</h4>
                <p className="text-muted-foreground text-sm">
                  {original.description || "ບໍ່ມີຄໍາອະທິບາຍ"}
                </p>
              </div>

              <div>
                <h4 className="mb-2 font-medium text-sm">
                  ສິດທິ ({original.permissions.length})
                </h4>
                <div className="flex flex-wrap gap-1">
                  {original.permissions.map((per) => (
                    <span
                      key={per}
                      className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 font-medium text-primary text-xs"
                    >
                      {getPermissionLabel(per as PermissionId)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
