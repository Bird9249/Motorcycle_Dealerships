import { formatDateTimeLocal } from "@/shared/lib/date-time";
import { RowActions } from "@/shared/ui/RowActions";
import {
  Badge,
  createExpandableColumn,
  createSortableColumn,
  DataTable,
  type TanstackReactTable,
} from "@devhop/ui";
import { EyeIcon } from "lucide-react";
import type { AuditItem } from "../api/client";
import { ActorCell } from "./ActorCell";

type AuditTableProps = {
  isLoading: boolean;
  data: AuditItem[];
  offset: number;
  limit: number;
  totalCount: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onPaginationChange: (offset: number, limit: number) => void;
  onSortingChange: (id: string, desc: boolean) => void;
  onView: (id: string) => void;
};

export function AuditTable({
  isLoading,
  data,
  offset,
  limit,
  totalCount,
  sortBy,
  sortOrder,
  onPaginationChange,
  onSortingChange,
  onView,
}: AuditTableProps) {
  const columns: TanstackReactTable.ColumnDef<AuditItem>[] = [
    createExpandableColumn<AuditItem>(""),
    createSortableColumn<AuditItem>("occurredAt", "ເວລາ", {
      size: 120,
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-muted-foreground text-xs">
          {formatDateTimeLocal(row.original.occurredAt)}
        </div>
      ),
    }),
    createSortableColumn<AuditItem>("action", "ການກະທໍາ", {
      size: 160,
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-mono text-[11px]">
          {row.original.action}
        </Badge>
      ),
    }),
    createSortableColumn<AuditItem>("actorId", "ຜູ້ກະທໍາ", {
      size: 160,
      cell: ({ row }) => <ActorCell item={row.original} />,
    }),
    createSortableColumn<AuditItem>("result", "ຜົນລັບ", {
      size: 90,
      cell: ({ row }) => (
        <Badge
          variant={row.original.result === "failed" ? "destructive" : "success"}
        >
          {row.original.result ?? "-"}
        </Badge>
      ),
    }),
    createSortableColumn<AuditItem>("path", "ເສັ້ນທາງ", {
      size: 220,
      cell: ({ row }) => (
        <span
          title={row.original.path ?? ""}
          className="block max-w-[240px] truncate font-mono text-xs"
        >
          {row.original.path ?? "-"}
        </span>
      ),
    }),
    {
      id: "actions",
      cell: ({ row }) => (
        <RowActions
          actions={[
            {
              label: "ເບິ່ງ",
              icon: <EyeIcon className="h-4 w-4" />,
              onClick: () => {
                onView(row.original.id);
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <DataTable<AuditItem, unknown>
      noDataMessage="ບໍ່ພົບບັນທຶກການກວດກາ"
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
        if (!sorting || sorting.length === 0) return;
        if (sorting[0]?.id === "") return;
        onSortingChange(sorting[0]?.id ?? "", !!sorting[0]?.desc);
      }}
      renderExpandedContent={({ original }) => (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <div className="text-muted-foreground text-xs">Entity Type</div>
            <div className="text-xs">{original.entityType ?? "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Entity ID</div>
            <div className="font-mono text-xs">{original.entityId ?? "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Tenant</div>
            <div className="font-mono text-xs">{original.tenantId ?? "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Trace ID</div>
            <div className="font-mono text-xs">{original.traceId ?? "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Request ID</div>
            <div className="font-mono text-xs">{original.requestId ?? "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">IP</div>
            <div className="font-mono text-xs">{original.ip ?? "-"}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-muted-foreground text-xs">User Agent</div>
            <div className="line-clamp-2 text-xs">
              {original.userAgent ?? "-"}
            </div>
          </div>
        </div>
      )}
    />
  );
}
