import { EditIcon } from "lucide-react";
import { useMemo } from "react";
import {
  Badge,
  createSortableColumn,
  DataTable,
  Switch,
  type TanstackReactTable,
} from "@/components/kit";
import { usePermissions } from "@/modules/auth/presentation/model/usePermissions";
import type { BrandDTO } from "@/modules/master-data/domain/contracts";
import { RowActions } from "@/shared/ui/RowActions";

type BrandsTableProps = {
  data: BrandDTO[];
  isLoading?: boolean;
  offset: number;
  limit: number;
  totalCount: number;
  onPaginationChange: (offset: number, limit: number) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortingChange: (id: string, desc: boolean) => void;
  onEdit: (brand: BrandDTO) => void;
  onStatusChange: (brand: BrandDTO, isActive: boolean) => void;
  statusPendingId?: string | null;
};

export function BrandsTable({
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
}: BrandsTableProps) {
  const { has } = usePermissions();
  const canUpdate = has("master-data:update");

  const columns: TanstackReactTable.ColumnDef<BrandDTO>[] = useMemo(
    () => [
      createSortableColumn<BrandDTO>("name", "ຊື່ຍີ່ຫໍ້"),
      createSortableColumn<BrandDTO>("slug", "Slug", {
        cell: ({ row }) => (
          <span className="font-mono text-muted-foreground text-xs">
            {row.original.slug}
          </span>
        ),
      }),
      createSortableColumn<BrandDTO>("modelCount", "ຈຳນວນລຸ່ນ", {
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.modelCount}</span>
        ),
      }),
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
                  aria-label={active ? "ປິດໃຊ້ງານ" : "ເປີດໃຊ້ງານ"}
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
        size: 80,
        cell: ({ row }) => {
          if (!canUpdate) return null;
          return (
            <RowActions
              actions={[
                {
                  label: "ແກ້ໄຂ",
                  icon: <EditIcon className="size-4" />,
                  onClick: () => onEdit(row.original),
                },
              ]}
            />
          );
        },
      },
    ],
    [canUpdate, onEdit, onStatusChange, statusPendingId],
  );

  return (
    <div data-tourid="master-data-table">
      <DataTable<BrandDTO, unknown>
      noDataMessage="ບໍ່ພົບຍີ່ຫໍ້"
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
    </div>
  );
}
