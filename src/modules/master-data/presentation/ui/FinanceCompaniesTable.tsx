import {
  Badge,
  createSortableColumn,
  DataTable,
  Switch,
  type TanstackReactTable,
} from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import type { FinanceCompanyItem } from "@/modules/sales/presentation/api/client";
import { RowActions } from "@/shared/ui/RowActions";
import { EditIcon } from "lucide-react";
import { useMemo } from "react";

type FinanceCompaniesTableProps = {
  data: FinanceCompanyItem[];
  isLoading?: boolean;
  offset: number;
  limit: number;
  totalCount: number;
  onPaginationChange: (offset: number, limit: number) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortingChange: (id: string, desc: boolean) => void;
  onEdit: (company: FinanceCompanyItem) => void;
  onStatusChange: (company: FinanceCompanyItem, isActive: boolean) => void;
  statusPendingId?: string | null;
};

export function FinanceCompaniesTable({
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
  onStatusChange,
  statusPendingId,
}: FinanceCompaniesTableProps) {
  const canUpdate = useActionPermission(["sales:update"]);

  const columns: TanstackReactTable.ColumnDef<FinanceCompanyItem>[] = useMemo(
    () => [
      createSortableColumn<FinanceCompanyItem>("name", "ຊື່"),
      createSortableColumn<FinanceCompanyItem>("code", "ລະຫັດ", {
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.code}</span>
        ),
      }),
      {
        id: "contactPhone",
        header: "ເບີຕິດຕໍ່",
        cell: ({ row }) => row.original.contactPhone ?? "—",
      },
      {
        id: "status",
        header: "ສະຖານະ",
        cell: ({ row }) => {
          const active = row.original.isActive;
          return (
            <div className="flex items-center gap-2">
              {canUpdate ? (
                <Switch
                  checked={active}
                  disabled={statusPendingId === row.original.id}
                  onCheckedChange={(checked) =>
                    onStatusChange(row.original, checked)
                  }
                />
              ) : null}
              <Badge variant={active ? "default" : "secondary"}>
                {active ? "ໃຊ້ງານ" : "ປິດ"}
              </Badge>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                label: "ແກ້ໄຂ",
                icon: <EditIcon className="size-4" />,
                onClick: () => onEdit(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [canUpdate, onEdit, onStatusChange, statusPendingId],
  );

  return (
    <DataTable<FinanceCompanyItem, unknown>
      noDataMessage="ບໍ່ພົບບໍລິສັດໄຟແນນ"
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
        if (!sorting[0]?.id) return;
        onSortingChange(sorting[0].id, !!sorting[0].desc);
      }}
    />
  );
}
