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
import type { ColorDTO } from "@/modules/master-data/domain/contracts";
import { RowActions } from "@/shared/ui/RowActions";

type ColorsTableProps = {
  data: ColorDTO[];
  isLoading?: boolean;
  offset: number;
  limit: number;
  totalCount: number;
  onPaginationChange: (offset: number, limit: number) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortingChange: (id: string, desc: boolean) => void;
  onEdit: (color: ColorDTO) => void;
  onStatusChange: (color: ColorDTO, isActive: boolean) => void;
  statusPendingId?: string | null;
};

function ColorSwatch({ hexCode, name }: { hexCode: string | null; name: string }) {
  if (!hexCode) {
    return <span className="text-muted-foreground text-sm">{name}</span>;
  }
  return (
    <div className="flex items-center gap-2">
      <span
        className="size-6 shrink-0 rounded-md border shadow-sm"
        style={{ backgroundColor: hexCode }}
        title={hexCode}
      />
      <span>{name}</span>
      <span className="font-mono text-muted-foreground text-xs">{hexCode}</span>
    </div>
  );
}

export function ColorsTable({
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
}: ColorsTableProps) {
  const { has } = usePermissions();
  const canUpdate = has("master-data:update");

  const columns: TanstackReactTable.ColumnDef<ColorDTO>[] = useMemo(
    () => [
      {
        id: "name",
        header: "ຊື່ສີ",
        accessorKey: "name",
        enableSorting: true,
        cell: ({ row }) => (
          <ColorSwatch
            hexCode={row.original.hexCode}
            name={row.original.name}
          />
        ),
      },
      createSortableColumn<ColorDTO>("hexCode", "Hex", {
        cell: ({ row }) => row.original.hexCode ?? "—",
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
      <DataTable<ColorDTO, unknown>
      noDataMessage="ບໍ່ພົບສີ"
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
