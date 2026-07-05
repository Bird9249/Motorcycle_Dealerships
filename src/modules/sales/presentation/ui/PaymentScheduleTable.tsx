import { useMemo } from "react";
import {
  Badge,
  createSortableColumn,
  DataTable,
  type TanstackReactTable,
} from "@/components/kit";
import { formatDateLocal } from "@/shared/lib/date-time";
import type { PaymentScheduleItem } from "../api/client";
import { formatCurrencyAmount, SCHEDULE_STATUS_LABELS } from "../lib/labels";

type PaymentScheduleTableProps = {
  data: PaymentScheduleItem[];
  isLoading?: boolean;
};

export function PaymentScheduleTable({
  data,
  isLoading,
}: PaymentScheduleTableProps) {
  const columns: TanstackReactTable.ColumnDef<PaymentScheduleItem>[] = useMemo(
    () => [
      createSortableColumn<PaymentScheduleItem>(
        "installmentNumber",
        "ງวด",
        {
          cell: ({ row }) => (
            <span className="font-medium tabular-nums">
              {row.original.installmentNumber}
            </span>
          ),
        },
      ),
      {
        id: "dueDate",
        header: "ກຳນົດຊຳລະ",
        cell: ({ row }) => formatDateLocal(row.original.dueDate),
      },
      {
        id: "amount",
        header: "ຈຳນວນ",
        cell: ({ row }) =>
          formatCurrencyAmount(
            row.original.amount,
            row.original.currency as "LAK" | "THB" | "USD",
          ),
      },
      {
        id: "status",
        header: "ສະຖານະ",
        cell: ({ row }) => {
          const status = row.original.status as keyof typeof SCHEDULE_STATUS_LABELS;
          const variant =
            status === "paid"
              ? "default"
              : status === "overdue"
                ? "destructive"
                : "secondary";
          return (
            <Badge variant={variant}>
              {SCHEDULE_STATUS_LABELS[status] ?? status}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  return (
    <DataTable<PaymentScheduleItem, unknown>
      data={data}
      columns={columns}
      isLoading={isLoading}
      offset={0}
      limit={Math.max(data.length, 1)}
      totalCount={data.length}
      enablePagination={false}
      onPaginationChange={() => {}}
      onSortingChange={() => {}}
      noDataMessage="ຍັງບໍ່ມີຕາຕະລາງຜ່ອນ"
    />
  );
}
