import { EditIcon, EyeIcon, FuelIcon, TrashIcon, ZapIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  Badge,
  cn,
  confirm,
  createSortableColumn,
  DataTable,
  type TanstackReactTable,
  toast,
} from "@/components/kit";
import { usePermissions } from "@/modules/auth/presentation/model/usePermissions";
import type { VehicleListItem } from "@/modules/inventory/domain/types";
import { RowActions } from "@/shared/ui/RowActions";
import { useDeleteVehicle } from "../api/queries";
import { VEHICLE_TYPE_LABELS } from "../lib/labels";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { VehicleStatusBadge } from "./VehicleStatusBadge";

type VehiclesTableProps = {
  data: VehicleListItem[];
  isLoading?: boolean;
  offset: number;
  limit: number;
  totalCount: number;
  onPaginationChange: (offset: number, limit: number) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortingChange: (id: string, desc: boolean) => void;
  onEdit: (vehicle: VehicleListItem) => void;
  onView: (vehicle: VehicleListItem) => void;
};

function ColorSwatch({
  name,
  hexCode,
}: {
  name: string;
  hexCode: string | null;
}) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
      <span
        className="size-3 shrink-0 rounded-full border shadow-sm ring-1 ring-black/5"
        style={{
          backgroundColor: hexCode ?? "var(--muted)",
        }}
        title={name}
        aria-hidden
      />
      {name}
    </div>
  );
}

function SerialCell({ value }: { value: string | null }) {
  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span className="font-mono text-xs tracking-tight">{value}</span>
  );
}

function VehicleTypeBadge({ type }: { type: "ice" | "ev" }) {
  const isEv = type === "ev";
  const Icon = isEv ? ZapIcon : FuelIcon;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-normal",
        isEv
          ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300",
      )}
    >
      <Icon className="size-3" />
      {VEHICLE_TYPE_LABELS[type]}
    </Badge>
  );
}

function formatPrice(amount: string, currency: string) {
  return `${Number(amount).toLocaleString()} ${currency}`;
}

export function VehiclesTable({
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
  onView,
}: VehiclesTableProps) {
  const { has } = usePermissions();
  const deleteVehicle = useDeleteVehicle();

  const canUpdate = has("inventory:update");
  const canDelete = has("inventory:delete");

  const columns: TanstackReactTable.ColumnDef<VehicleListItem>[] = useMemo(
    () => [
      {
        id: "brand",
        header: "ຍີ່ຫໍ້ / ລຸ່ນ",
        cell: ({ row }) => (
          <div className="min-w-[160px] py-0.5">
            <div className="font-medium leading-snug">
              {row.original.brand.name}
            </div>
            <div className="text-muted-foreground text-sm">
              {row.original.model.name}
            </div>
            <ColorSwatch
              name={row.original.color.name}
              hexCode={row.original.color.hexCode}
            />
          </div>
        ),
        size: 180,
      },
      {
        id: "vehicleType",
        header: "ປະເພດ",
        cell: ({ row }) => (
          <VehicleTypeBadge type={row.original.model.vehicleType} />
        ),
        size: 90,
      },
      createSortableColumn<VehicleListItem>("chassisNumber", "ເລກຖັງ", {
        size: 130,
        cell: ({ row }) => (
          <SerialCell value={row.original.chassisNumber} />
        ),
      }),
      createSortableColumn<VehicleListItem>("engineNumber", "ເລກຈັກ", {
        size: 120,
        cell: ({ row }) => (
          <SerialCell value={row.original.engineNumber} />
        ),
      }),
      {
        id: "batterySerialNumber",
        header: "ແບັດເຕີຣີ",
        cell: ({ row }) => (
          <SerialCell value={row.original.batterySerialNumber} />
        ),
        size: 120,
      },
      {
        id: "status",
        header: "ສະຖານະ",
        cell: ({ row }) => <VehicleStatusBadge status={row.original.status} />,
        size: 110,
      },
      {
        id: "listPrice",
        header: "ລາຄາຂາຍ",
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {formatPrice(row.original.listPrice, row.original.listCurrency)}
          </span>
        ),
        size: 130,
      },
      {
        id: "documents",
        header: "ເອກະສານ",
        cell: ({ row }) => (
          <DocumentStatusBadge
            importInvoiceReceived={row.original.importInvoiceReceived}
            technicalInspectionReceived={
              row.original.technicalInspectionReceived
            }
            registrationReady={row.original.registrationReady}
          />
        ),
        size: 220,
      },
      {
        id: "actions",
        size: 90,
        cell: ({ row }) => {
          const id = row.original.id;
          const locked =
            row.original.status === "sold" ||
            row.original.status === "reserved";
          const actions: {
            label: string;
            icon?: ReactNode;
            variant?: "destructive";
            onClick: () => void;
          }[] = [];

          if (canUpdate && !locked) {
            actions.push({
              label: "ແກ້ໄຂ",
              icon: <EditIcon className="size-4" />,
              onClick: () => onEdit(row.original),
            });
          }

          actions.push({
            label: "ເບິ່ງ",
            icon: <EyeIcon className="size-4" />,
            onClick: () => onView(row.original),
          });

          if (canDelete && !locked) {
            actions.push({
              label: "ລຶບ",
              variant: "destructive",
              icon: <TrashIcon className="size-4" />,
              onClick: async () => {
                const ok = await confirm({
                  title: "ລຶບລົດ",
                  description: "ທ່ານແນ່ໃຈບໍ່ວ່າຈະລຶບລົດຄັນນີ້?",
                  actionText: "ລຶບ",
                  ActionProps: { variant: "destructive" },
                });
                if (!ok) return;
                toast.promise(deleteVehicle.run(id), {
                  loading: "ກຳລັງລຶບ...",
                  success: "ລຶບລົດສຳເລັດ",
                  error: "ລຶບລົດລົ້ມເຫຼວ",
                });
              },
            });
          }

          if (actions.length === 0) return null;
          return <RowActions actions={actions} maxInline={2} />;
        },
      },
    ],
    [canDelete, canUpdate, deleteVehicle, onEdit, onView],
  );

  return (
    <div className="px-1 pb-1" data-tourid="vehicles-table">
      <DataTable<VehicleListItem, unknown>
        noDataMessage="ບໍ່ພົບລົດ — ລອງປ່ຽນຕົວກອງ ຫຼື ເພີ່ມລົດໃໝ່"
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
  );
}
