import { useMemo } from "react";
import {
  Badge,
  createSortableColumn,
  DataTable,
  type TanstackReactTable,
} from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import { formatDateLocal } from "@/shared/lib/date-time";
import { RowActions } from "@/shared/ui/RowActions";
import { WalletIcon } from "lucide-react";
import type { PaymentScheduleItem } from "../api/client";
import { formatCurrencyAmount, SCHEDULE_STATUS_LABELS } from "../lib/labels";

type PaymentScheduleTableProps = {
  data: PaymentScheduleItem[];
  isLoading?: boolean;
  onPay?: (schedule: PaymentScheduleItem) => void;
};

export function PaymentScheduleTable({
  data,
  isLoading,
  onPay,
}: PaymentScheduleTableProps) {
  const canPay = useActionPermission(["payments:create"]);
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
      ...(canPay && onPay
        ? [
            {
              id: "actions",
              header: "",
              cell: ({ row }: { row: { original: PaymentScheduleItem } }) => {
                const status = row.original.status;
                if (status !== "pending" && status !== "overdue") return null;
                return (
                  <RowActions
                    actions={[
                      {
                        label: "ຊຳລະງວດ",
                        icon: <WalletIcon className="size-4" />,
                        onClick: () => onPay(row.original),
                      },
                    ]}
                  />
                );
              },
            } as TanstackReactTable.ColumnDef<PaymentScheduleItem>,
          ]
        : []),
    ],
    [canPay, onPay],
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
