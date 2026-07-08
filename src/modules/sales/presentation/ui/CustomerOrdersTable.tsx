import { useNavigate } from "@tanstack/react-router";
import { EyeIcon } from "lucide-react";
import { useMemo } from "react";
import {
  createSortableColumn,
  DataTable,
  type TanstackReactTable,
} from "@/components/kit";
import { formatDateLocal } from "@/shared/lib/date-time";
import { RowActions } from "@/shared/ui/RowActions";
import type { SalesOrderListItem } from "../api/client";
import {
  formatCurrencyAmount,
  type SalePaymentType,
} from "../lib/labels";
import { PaymentTypeBadge, SalesStatusBadge } from "./SalesStatusBadge";

type CustomerOrdersTableProps = {
  data: SalesOrderListItem[];
  isLoading?: boolean;
};

export function CustomerOrdersTable({
  data,
  isLoading,
}: CustomerOrdersTableProps) {
  const nav = useNavigate();

  const columns: TanstackReactTable.ColumnDef<SalesOrderListItem>[] = useMemo(
    () => [
      createSortableColumn<SalesOrderListItem>("orderNumber", "ເລກທີ", {
        cell: ({ row }) => (
          <span className="font-medium">{row.original.orderNumber}</span>
        ),
      }),
      {
        id: "vehicle",
        header: "ລົດ",
        cell: ({ row }) => (
          <div className="text-sm">
            <div>
              {row.original.vehicle.brandName} {row.original.vehicle.modelName}
            </div>
            <div className="text-muted-foreground text-xs">
              {row.original.vehicle.chassisNumber ?? "—"}
            </div>
          </div>
        ),
      },
      {
        id: "paymentType",
        header: "ຮູບແບບ",
        cell: ({ row }) => (
          <PaymentTypeBadge
            type={row.original.paymentType as SalePaymentType}
          />
        ),
      },
      {
        id: "status",
        header: "ສະຖານະ",
        cell: ({ row }) => <SalesStatusBadge status={row.original.status} />,
      },
      createSortableColumn<SalesOrderListItem>("salePrice", "ລາຄາ", {
        cell: ({ row }) =>
          formatCurrencyAmount(
            row.original.salePrice,
            row.original.saleCurrency,
          ),
      }),
      createSortableColumn<SalesOrderListItem>("soldAt", "ວັນຂາຍ", {
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {row.original.soldAt
              ? formatDateLocal(row.original.soldAt)
              : "—"}
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
                onClick: () =>
                  nav({
                    to: "/app/sales/$id",
                    params: { id: row.original.id },
                  }),
              },
            ]}
          />
        ),
      },
    ],
    [nav],
  );

  return (
    <DataTable<SalesOrderListItem, unknown>
      noDataMessage="ຍັງບໍ່ມີຄຳສັ່ງຂາຍ"
      isLoading={isLoading}
      columns={columns}
      data={data}
      offset={0}
      limit={data.length || 20}
      totalCount={data.length}
      onPaginationChange={() => {}}
      enablePagination={false}
    />
  );
}
