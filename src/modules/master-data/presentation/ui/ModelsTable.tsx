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
import type { ModelDTO } from "@/modules/master-data/domain/contracts";
import { RowActions } from "@/shared/ui/RowActions";
import { VEHICLE_TYPE_LABELS } from "../lib/labels";

type ModelsTableProps = {
  data: ModelDTO[];
  isLoading?: boolean;
  offset: number;
  limit: number;
  totalCount: number;
  onPaginationChange: (offset: number, limit: number) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortingChange: (id: string, desc: boolean) => void;
  onEdit: (model: ModelDTO) => void;
  onStatusChange: (model: ModelDTO, isActive: boolean) => void;
  statusPendingId?: string | null;
};

export function ModelsTable({
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
}: ModelsTableProps) {
  const { has } = usePermissions();
  const canUpdate = has("master-data:update");

  const columns: TanstackReactTable.ColumnDef<ModelDTO>[] = useMemo(
    () => [
      {
        id: "brand",
        header: "ຍີ່ຫໍ້",
        accessorFn: (row) => row.brand?.name ?? "",
        cell: ({ row }) => row.original.brand?.name ?? "—",
      },
      createSortableColumn<ModelDTO>("name", "ຊື່ລຸ່ນ"),
      {
        id: "vehicleType",
        header: "ປະເພດ",
        cell: ({ row }) => {
          const type = row.original.vehicleType;
          return (
            <Badge variant={type === "ev" ? "default" : "outline"}>
              {VEHICLE_TYPE_LABELS[type]}
            </Badge>
          );
        },
      },
      {
        id: "spec",
        header: "ສະເປັກ",
        cell: ({ row }) => {
          const m = row.original;
          if (m.vehicleType === "ice") {
            return m.engineCc ? `${m.engineCc} cc` : "—";
          }
          return m.batteryCapacityKwh ? `${m.batteryCapacityKwh} kWh` : "—";
        },
      },
      createSortableColumn<ModelDTO>("year", "ປີ", {
        cell: ({ row }) => row.original.year ?? "—",
      }),
      createSortableColumn<ModelDTO>("vehicleCount", "ຈຳນວນລົດ", {
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.vehicleCount}</span>
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
      <DataTable<ModelDTO, unknown>
      noDataMessage="ບໍ່ພົບລຸ່ນ"
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
