import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Badge,
  createSortableColumn,
  DataTable,
  type TanstackReactTable,
} from "@/components/kit";
import { formatDateTimeLocal } from "@/shared/lib/date-time";
import type { ServiceRecordListItem } from "../api/client";
import { SERVICE_TYPE_LABELS } from "../lib/labels";

type ServiceHistoryTableProps = {
  data: ServiceRecordListItem[];
  isLoading?: boolean;
  showVehicle?: boolean;
  showCustomer?: boolean;
  compact?: boolean;
};

export function ServiceHistoryTable({
  data,
  isLoading,
  showVehicle = false,
  showCustomer = false,
  compact = false,
}: ServiceHistoryTableProps) {
  const nav = useNavigate();

  const columns: TanstackReactTable.ColumnDef<ServiceRecordListItem>[] =
    useMemo(() => {
      const cols: TanstackReactTable.ColumnDef<ServiceRecordListItem>[] = [
        createSortableColumn<ServiceRecordListItem>("performedAt", "ວັນທີ", {
          cell: ({ row }) => formatDateTimeLocal(row.original.performedAt),
        }),
        {
          id: "serviceType",
          header: "ປະເພດ",
          cell: ({ row }) => (
            <Badge variant="outline">
              {SERVICE_TYPE_LABELS[row.original.serviceType]}
            </Badge>
          ),
        },
      ];

      if (showVehicle) {
        cols.push({
          id: "vehicle",
          header: "ລົດ",
          cell: ({ row }) => (
            <button
              type="button"
              className="text-left text-sm hover:underline"
              onClick={() =>
                nav({
                  to: "/app/inventory/vehicles/$id",
                  params: { id: row.original.vehicleId },
                })
              }
            >
              <div>
                {row.original.vehicle.brandName} {row.original.vehicle.modelName}
              </div>
              <div className="text-muted-foreground text-xs">
                {row.original.vehicle.chassisNumber ?? "—"}
              </div>
            </button>
          ),
        });
      }

      if (showCustomer) {
        cols.push({
          id: "customer",
          header: "ລູກຄ້າ",
          cell: ({ row }) => row.original.customer.fullName,
        });
      }

      cols.push(
        {
          id: "odometer",
          header: "ໄມລ໌",
          cell: ({ row }) =>
            row.original.odometerKm != null
              ? `${row.original.odometerKm.toLocaleString()} ກມ.`
              : "—",
        },
        {
          id: "description",
          header: "ລາຍລະອຽດ",
          cell: ({ row }) => (
            <span className="line-clamp-2 text-sm">
              {row.original.description}
            </span>
          ),
        },
      );

      if (!compact) {
        cols.push({
          id: "battery",
          header: "ແບດ",
          cell: ({ row }) =>
            row.original.batteryHealthPercent != null ? (
              <span className="text-sm">
                {row.original.batteryHealthPercent}%
                {row.original.batteryNotes
                  ? ` · ${row.original.batteryNotes}`
                  : ""}
              </span>
            ) : (
              "—"
            ),
        });
        cols.push({
          id: "performedBy",
          header: "ຜູ້ບັນທຶກ",
          cell: ({ row }) => row.original.performedByUser.name,
        });
      }

      return cols;
    }, [compact, nav, showCustomer, showVehicle]);

  if (!isLoading && data.length === 0) {
    return (
      <p className="py-6 text-center text-muted-foreground text-sm">
        ຍັງບໍ່ມີປະຫວັດບໍລິການ
      </p>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      enablePagination={false}
      noDataMessage="ບໍ່ພົບປະຫວັດບໍລິການ"
    />
  );
}
