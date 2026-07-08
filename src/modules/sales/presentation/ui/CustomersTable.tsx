import { EditIcon, EyeIcon } from "lucide-react";
import { useMemo } from "react";
import {
  createSortableColumn,
  DataTable,
  type TanstackReactTable,
} from "@/components/kit";
import { formatDateTimeLocal } from "@/shared/lib/date-time";
import { RowActions } from "@/shared/ui/RowActions";
import type { CustomerItem } from "../api/client";

type CustomersTableProps = {
  data: CustomerItem[];
  isLoading?: boolean;
  offset: number;
  limit: number;
  totalCount: number;
  onPaginationChange: (offset: number, limit: number) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortingChange?: (id: string, desc: boolean) => void;
  onEdit: (customer: CustomerItem) => void;
  onView: (customer: CustomerItem) => void;
};

export function CustomersTable({
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
}: CustomersTableProps) {
  const columns: TanstackReactTable.ColumnDef<CustomerItem>[] = useMemo(
    () => [
      createSortableColumn<CustomerItem>("fullName", "ຊື່", {
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.fullName}</div>
            {row.original.province ? (
              <div className="text-muted-foreground text-xs">
                {[row.original.village, row.original.district, row.original.province]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            ) : null}
          </div>
        ),
      }),
      {
        id: "phone",
        header: "ເບີໂທ",
        cell: ({ row }) => (
          <div className="text-sm">
            <div>{row.original.phone}</div>
            {row.original.phoneSecondary ? (
              <div className="text-muted-foreground text-xs">
                {row.original.phoneSecondary}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        id: "idCardNumber",
        header: "ບັດ/ສຳມະໂນຄົວ",
        cell: ({ row }) => (
          <div className="text-xs">
            <div>{row.original.idCardNumber ?? "—"}</div>
            <div className="text-muted-foreground">
              {row.original.householdBookNumber ?? ""}
            </div>
          </div>
        ),
      },
      createSortableColumn<CustomerItem>("createdAt", "ສ້າງເມື່ອ", {
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
    [onEdit, onView],
  );

  return (
    <DataTable<CustomerItem, unknown>
      noDataMessage="ບໍ່ພົບລູກຄ້າ"
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
        if (!onSortingChange || !sorting[0]?.id) return;
        onSortingChange(sorting[0].id, !!sorting[0].desc);
      }}
    />
  );
}
