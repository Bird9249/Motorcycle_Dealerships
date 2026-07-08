import {
  Badge,
  createSortableColumn,
  DataTable,
  Switch,
  type TanstackReactTable,
} from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import type { PaymentAccountItem } from "@/modules/payments/presentation/api/client";
import { RowActions } from "@/shared/ui/RowActions";
import { EditIcon } from "lucide-react";
import { useMemo } from "react";

const TYPE_LABELS: Record<PaymentAccountItem["type"], string> = {
  cash: "ເງິນສົດ",
  bank_transfer: "ໂອນທະນາຄານ",
};

type PaymentAccountsTableProps = {
  data: PaymentAccountItem[];
  isLoading?: boolean;
  offset: number;
  limit: number;
  totalCount: number;
  onPaginationChange: (offset: number, limit: number) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortingChange: (id: string, desc: boolean) => void;
  onEdit: (account: PaymentAccountItem) => void;
  onStatusChange: (account: PaymentAccountItem, isActive: boolean) => void;
  statusPendingId?: string | null;
};

export function PaymentAccountsTable({
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
}: PaymentAccountsTableProps) {
  const canUpdate = useActionPermission(["payments:update"]);

  const columns: TanstackReactTable.ColumnDef<PaymentAccountItem>[] = useMemo(
    () => [
      createSortableColumn<PaymentAccountItem>("displayOrder", "ລຳດັບ", {
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.displayOrder}</span>
        ),
      }),
      createSortableColumn<PaymentAccountItem>("name", "ຊື່"),
      {
        id: "type",
        header: "ປະເພດ",
        cell: ({ row }) => TYPE_LABELS[row.original.type],
      },
      {
        id: "bank",
        header: "ທະນາຄານ / ເລກບັນຊີ",
        cell: ({ row }) => {
          if (row.original.type === "cash") return "—";
          return [row.original.bankName, row.original.accountNumber]
            .filter(Boolean)
            .join(" · ");
        },
      },
      {
        id: "currency",
        header: "ສະກຸນ",
        cell: ({ row }) => row.original.currency,
      },
      {
        id: "qr",
        header: "QR",
        cell: ({ row }) =>
          row.original.qrCodeImageKey ? (
            <Badge variant="outline">ມີ</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
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
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                label: "ແກ້ໄຂ",
                icon: <EditIcon className="size-4" />,
                onClick: () => onEdit(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [canUpdate, onEdit, onStatusChange, statusPendingId],
  );

  return (
    <DataTable<PaymentAccountItem, unknown>
      noDataMessage="ບໍ່ພົບບັນຊີຮັບເງິນ"
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
