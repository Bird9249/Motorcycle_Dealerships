import type { MediaListResult } from "@/modules/media/domain/types";
import { config } from "@/shared/lib/config";
import { formatDateTime } from "@/shared/lib/date-time";
import { RowActions } from "@/shared/ui/RowActions";
import {
  Badge,
  createSortableColumn,
  DataTable,
  type TanstackReactTable,
} from "@devhop/ui";
import {
  ArchiveIcon,
  ArchiveXIcon,
  EditIcon,
  FileIcon,
  TrashIcon,
} from "lucide-react";

type MediaRow = MediaListResult["data"][number];

type MediaTableProps = {
  data: MediaRow[];
  isLoading?: boolean;
  offset: number;
  limit: number;
  totalCount: number;
  onPaginationChange: (offset: number, limit: number) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortingChange: (id: string, desc: boolean) => void;
  onEdit: (media: MediaRow) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
};

export function MediaTable({
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
  onDelete,
  onArchive,
  onUnarchive,
}: MediaTableProps) {
  const columns: TanstackReactTable.ColumnDef<MediaRow>[] = [
    {
      id: "thumbnail",
      header: "ຮູບພາບ",
      cell: ({ row }) => {
        const isImage = row.original.mimeType?.startsWith("image/");
        return (
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded border">
            {isImage ? (
              <img
                src={config.apiUrl + row.original.fileUrl}
                alt={row.original.altText || row.original.fileName || ""}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-muted-foreground text-xs">
                <FileIcon className="h-4 w-4" />
              </span>
            )}
          </div>
        );
      },
      size: 80,
    },
    createSortableColumn<MediaRow>("fileName", "ຊື່ຟາຍ", {
      size: 150,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.fileName ?? "-"}
        </span>
      ),
    }),
    createSortableColumn<MediaRow>("mimeType", "ປະເພດ", { size: 100 }),
    {
      id: "fileSize",
      header: "ຂະໜາດ",
      cell: ({ row }) => {
        const size = row.original.fileSize;
        if (!size)
          return <span className="text-muted-foreground text-sm">-</span>;
        const kb = size / 1024;
        const mb = kb / 1024;
        return (
          <span className="text-muted-foreground text-sm">
            {mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`}
          </span>
        );
      },
      size: 80,
    },
    {
      id: "createdBy",
      header: "ອັບໂຫຼດໂດຍ",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.createdByName || row.original.createdByEmail || "-"}
        </span>
      ),
      size: 120,
    },
    {
      id: "archived",
      header: "ສະຖານະ",
      cell: ({ row }) =>
        row.original.archived ? (
          <Badge variant="secondary">ຖືກເກັບໄວ້</Badge>
        ) : (
          <Badge variant="default">ທີ່ໃຊ້ຢູ່</Badge>
        ),
      size: 100,
    },
    createSortableColumn<MediaRow>("createdAt", "ວັນທີ່", {
      size: 120,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    }),
    {
      id: "actions",
      cell: ({ row }) => {
        const actions = [];
        actions.push({
          label: "ແກ້ໄຂ",
          icon: <EditIcon className="h-4 w-4" />,
          onClick: () => onEdit(row.original),
        });
        actions.push({
          label: "ເກັບໄວ້",
          icon: <ArchiveIcon className="h-4 w-4" />,
          onClick: () => onArchive(row.original.id),
        });
        actions.push({
          label: "ເອົາອອກຈາກການເກັບໄວ້",
          icon: <ArchiveXIcon className="h-4 w-4" />,
          onClick: () => onUnarchive(row.original.id),
        });
        actions.push({
          label: "ລຶບ",
          icon: <TrashIcon className="h-4 w-4" />,
          onClick: () => onDelete(row.original.id),
          variant: "destructive" as const,
        });
        return <RowActions actions={actions} />;
      },
    },
  ];

  return (
    <div data-tourid="media-table">
      <DataTable<MediaRow, unknown>
        data={data}
        columns={columns}
        isLoading={isLoading}
        totalCount={totalCount}
        offset={offset}
        limit={limit}
        onPaginationChange={(params) =>
          onPaginationChange(params.offset, params.limit)
        }
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortingChange={(sorting) => {
          if (!sorting[0] || sorting[0].id === "") return;
          onSortingChange(sorting[0].id, !!sorting[0].desc);
        }}
      />
    </div>
  );
}
