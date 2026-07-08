import {
  createSortableColumn,
  DataTable,
  type TanstackReactTable,
} from "@/components/kit";
import { formatCurrencyAmount } from "@/modules/sales/presentation/lib/labels";
import { formatDateTimeLocal } from "@/shared/lib/date-time";
import { RowActions } from "@/shared/ui/RowActions";
import { EyeIcon } from "lucide-react";
import { useMemo } from "react";
import type { PaymentListItem } from "../api/client";
import { PAYMENT_METHOD_LABELS } from "../lib/labels";
import { PaymentStatusBadge } from "./PaymentStatusBadge";

type PaymentsTableProps = {
  data: PaymentListItem[];
  isLoading?: boolean;
  offset: number;
  limit: number;
  totalCount: number;
  onPaginationChange: (offset: number, limit: number) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortingChange: (id: string, desc: boolean) => void;
  onView: (payment: PaymentListItem) => void;
};

export function PaymentsTable({
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
}: PaymentsTableProps) {
  const columns: TanstackReactTable.ColumnDef<PaymentListItem>[] = useMemo(
    () => [
      createSortableColumn<PaymentListItem>("paymentNumber", "ເລກທີ່", {
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.paymentNumber}</span>
        ),
      }),
      createSortableColumn<PaymentListItem>("paidAt", "ວັນຊຳລະ", {
        cell: ({ row }) => formatDateTimeLocal(row.original.paidAt),
      }),
      {
        id: "amount",
        header: "ຈຳນວນ",
        cell: ({ row }) =>
          formatCurrencyAmount(row.original.amount, row.original.currency),
      },
      {
        id: "account",
        header: "ບັນຊີ",
        cell: ({ row }) => row.original.paymentAccountName,
      },
      {
        id: "method",
        header: "ວິທີ",
        cell: ({ row }) => PAYMENT_METHOD_LABELS[row.original.paymentMethod],
      },
      {
        id: "link",
        header: "ອ້າງອີງ",
        cell: ({ row }) => {
          if (row.original.installmentNumber != null) {
            return `ງວດ #${row.original.installmentNumber}`;
          }
          if (row.original.orderNumber) return row.original.orderNumber;
          return "—";
        },
      },
      {
        id: "status",
        header: "ສະຖານະ",
        cell: ({ row }) => <PaymentStatusBadge status={row.original.status} />,
      },
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
            ]}
          />
        ),
      },
    ],
    [onView],
  );

  return (
    <DataTable<PaymentListItem, unknown>
      noDataMessage="ບໍ່ພົບການຊຳລະ"
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
