import { EyeIcon, PencilIcon } from "lucide-react";
import { useMemo } from "react";
import {
  createSortableColumn,
  DataTable,
  type TanstackReactTable,
} from "@/components/kit";
import { formatDateTimeLocal } from "@/shared/lib/date-time";
import { RowActions } from "@/shared/ui/RowActions";
import type { SalesOrderListItem } from "../api/client";
import { formatCurrencyAmount } from "../lib/labels";
import { PaymentTypeBadge, SalesStatusBadge } from "./SalesStatusBadge";

type SalesTableProps = {
  data: SalesOrderListItem[];
  isLoading?: boolean;
  offset: number;
  limit: number;
  totalCount: number;
  onPaginationChange: (offset: number, limit: number) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortingChange: (id: string, desc: boolean) => void;
  onView: (order: SalesOrderListItem) => void;
  onEdit?: (order: SalesOrderListItem) => void;
};

export function SalesTable({
  data,
  isLoading,
  offset,
  limit,
  totalCount,
  onPaginationChange,
  sortBy,
  sortOrder,
  onSortingChange,
  onView,
  onEdit,
}: SalesTableProps) {
  const columns: TanstackReactTable.ColumnDef<SalesOrderListItem>[] = useMemo(
    () => [
      createSortableColumn<SalesOrderListItem>("orderNumber", "ເລກທີ", {
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.orderNumber}</span>
        ),
      }),
      {
        id: "vehicle",
        header: "ລົດ",
        cell: ({ row }) => (
          <div className="min-w-[140px]">
            <div className="font-medium text-sm">
              {row.original.vehicle.brandName} {row.original.vehicle.modelName}
            </div>
            <div className="text-muted-foreground text-xs">
              {row.original.vehicle.chassisNumber ?? "—"}
            </div>
          </div>
        ),
      },
      {
        id: "customer",
        header: "ລູກຄ້າ",
        cell: ({ row }) => (
          <div>
            <div className="text-sm">{row.original.customer.fullName}</div>
            <div className="text-muted-foreground text-xs">
              {row.original.customer.phone}
            </div>
          </div>
        ),
      },
      {
        id: "paymentType",
        header: "ປະເພດ",
        cell: ({ row }) => (
          <PaymentTypeBadge type={row.original.paymentType} />
        ),
      },
      createSortableColumn<SalesOrderListItem>("salePrice", "ລາຄາ", {
        cell: ({ row }) =>
          formatCurrencyAmount(
            row.original.salePrice,
            row.original.saleCurrency,
          ),
      }),
      {
        id: "status",
        header: "ສະຖານະ",
        cell: ({ row }) => <SalesStatusBadge status={row.original.status} />,
      },
      createSortableColumn<SalesOrderListItem>("createdAt", "ວັນທີ", {
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {formatDateTimeLocal(row.original.createdAt)}
          </span>
        ),
      }),
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                label: "ເບິ່ງ",
                icon: <EyeIcon className="size-4" />,
                onClick: () => onView(row.original),
              },
              ...(row.original.status === "draft" && onEdit
                ? [
                    {
                      label: "ແກ້ໄຂ",
                      icon: <PencilIcon className="size-4" />,
                      onClick: () => onEdit(row.original),
                    },
                  ]
                : []),
            ]}
          />
        ),
      },
    ],
    [onView, onEdit],
  );

  return (
    <DataTable<SalesOrderListItem, unknown>
      noDataMessage="ບໍ່ພົບຄຳສັ່ງຂາຍ"
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
