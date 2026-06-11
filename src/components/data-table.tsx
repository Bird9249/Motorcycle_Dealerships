import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import * as React from "react";

type ColumnCellProps<TData> = {
  row: { getValue: (key: string) => unknown; original: TData };
};

type ColumnHelperOptions<TData> = {
  size?: number;
  cell?: (props: ColumnCellProps<TData>) => React.ReactNode;
};

// Default cell renderer: shows the raw accessor value when no custom cell.
function defaultValueCell<TData>(
  custom?: (props: ColumnCellProps<TData>) => React.ReactNode,
) {
  // biome-ignore lint/suspicious/noExplicitAny: bridge tanstack cell context
  return ((context: any) => {
    if (custom) return custom(context);
    const value = context.getValue();
    return value == null ? null : String(value);
    // biome-ignore lint/suspicious/noExplicitAny: bridge tanstack cell context
  }) as any;
}

export function createSortableColumn<TData>(
  accessorKey: keyof TData,
  header: string,
  options?: ColumnHelperOptions<TData>,
): ColumnDef<TData, unknown> {
  return {
    accessorKey: accessorKey as string,
    header,
    enableSorting: true,
    size: options?.size,
    cell: defaultValueCell<TData>(options?.cell),
  };
}

export function createFilterableColumn<TData>(
  accessorKey: keyof TData,
  header: string,
  options?: ColumnHelperOptions<TData>,
): ColumnDef<TData, unknown> {
  return {
    accessorKey: accessorKey as string,
    header,
    enableColumnFilter: true,
    size: options?.size,
    cell: defaultValueCell<TData>(options?.cell),
  };
}

export function createSelectableColumn<TData>(
  accessorKey: keyof TData,
  header: string,
  options?: ColumnHelperOptions<TData>,
): ColumnDef<TData, unknown> {
  return {
    accessorKey: accessorKey as string,
    header,
    size: options?.size,
    cell: defaultValueCell<TData>(options?.cell),
  };
}

export function createExpandableColumn<TData>(
  header = "",
  options?: ColumnHelperOptions<TData>,
): ColumnDef<TData, unknown> {
  return {
    id: "expander",
    header,
    enableSorting: false,
    size: options?.size ?? 40,
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label="Toggle row"
        onClick={(event) => {
          event.stopPropagation();
          row.toggleExpanded();
        }}
      >
        {row.getIsExpanded() ? (
          <ChevronUp className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
      </Button>
    ),
  };
}

/** Checkbox column for bulk row selection (requires `enableRowSelection` on DataTable). */
export function createSelectColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : false
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="ເລືອກທັງໝດ"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="ເລືອກແຖວ"
      />
    ),
    enableSorting: false,
    size: 40,
  };
}

export function offsetToPageIndex(offset: number, limit: number): number {
  return limit > 0 ? Math.floor(offset / limit) : 0;
}
export function pageIndexToOffset(pageIndex: number, limit: number): number {
  return pageIndex * limit;
}
export function limitToPageSize(limit: number): number {
  return limit;
}
export function pageSizeToLimit(pageSize: number): number {
  return pageSize;
}

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];

type PageItem = number | "ellipsis-left" | "ellipsis-right";

/** Build a compact page list (1-based) with ellipses for large page counts. */
function getPageItems(current: number, total: number): PageItem[] {
  if (total <= 1) return [1];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const items: PageItem[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) items.push("ellipsis-left");
  for (let page = left; page <= right; page++) items.push(page);
  if (right < total - 1) items.push("ellipsis-right");
  items.push(total);
  return items;
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalCount?: number;
  isLoading?: boolean;
  limit?: number;
  offset?: number;
  onPaginationChange?: (params: { limit: number; offset: number }) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortingChange?: (sorting: SortingState) => void;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  /** Notifies selected row ids after render (safe for parent setState). */
  onSelectionChange?: (selectedIds: string[]) => void;
  /** Increment to clear row selection (e.g. after bulk actions). */
  selectionResetKey?: number;
  getRowId?: (row: TData) => string;
  getRowCanSelect?: (row: TData) => boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableRowSelection?: boolean;
  enablePagination?: boolean;
  noDataMessage?: string;
  className?: string;
  renderExpandedContent?: (row: {
    original: TData;
    getValue: (key: string) => unknown;
  }) => React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalCount = 0,
  isLoading = false,
  limit = 10,
  offset = 0,
  onPaginationChange,
  sortBy,
  sortOrder,
  onSortingChange,
  onRowSelectionChange,
  onSelectionChange,
  selectionResetKey = 0,
  getRowId,
  getRowCanSelect,
  enableSorting = true,
  enableRowSelection = false,
  enablePagination = true,
  noDataMessage = "ບໍ່ມີຂໍ້ມູນ",
  className,
  renderExpandedContent,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const sorting: SortingState = React.useMemo(
    () => (sortBy ? [{ id: sortBy, desc: sortOrder === "desc" }] : []),
    [sortBy, sortOrder],
  );

  React.useEffect(() => {
    setRowSelection({});
  }, [offset, limit, selectionResetKey]);

  React.useEffect(() => {
    if (!enableRowSelection || !onSelectionChange) return;
    onSelectionChange(
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => id),
    );
  }, [enableRowSelection, onSelectionChange, rowSelection]);

  const pageIndex = offsetToPageIndex(offset, limit);
  const pageCount = limit > 0 ? Math.ceil(totalCount / limit) : 0;
  const totalPages = Math.max(pageCount, 1);
  const currentPage = pageIndex + 1;
  const isFirstPage = currentPage <= 1 || isLoading;
  const isLastPage = currentPage >= totalPages || isLoading;
  const pageItems = getPageItems(currentPage, totalPages);

  const goToPage = (page: number) => {
    const clamped = Math.min(Math.max(page, 1), totalPages);
    onPaginationChange?.({
      limit,
      offset: pageIndexToOffset(clamped - 1, limit),
    });
  };

  const handleRowSelectionChange = React.useCallback(
    (
      updater:
        | RowSelectionState
        | ((old: RowSelectionState) => RowSelectionState),
    ) => {
      setRowSelection((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        onRowSelectionChange?.(next);
        return next;
      });
    },
    [onRowSelectionChange],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      ...(enableRowSelection ? { rowSelection } : {}),
    },
    manualPagination: true,
    autoResetPageIndex: false,
    pageCount,
    enableSorting,
    enableSortingRemoval: false,
    manualSorting: true,
    enableRowSelection: getRowCanSelect
      ? (row) => Boolean(enableRowSelection) && getRowCanSelect(row.original)
      : enableRowSelection,
    getRowId: getRowId ?? undefined,
    getRowCanExpand: () => !!renderExpandedContent,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onRowSelectionChange: handleRowSelectionChange,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      // Avoid emitting an empty/malformed sort (missing column id).
      if (next.length === 0 || !next[0]?.id) return;
      onSortingChange?.(next);
    },
  });

  const columnCount = table.getAllLeafColumns().length;
  const rows = table.getCoreRowModel().rows;

  return (
    <div className={cn("flex flex-col gap-4 py-2", className)}>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = enableSorting && header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      style={
                        header.getSize()
                          ? { width: header.getSize() }
                          : undefined
                      }
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className="-ml-1 inline-flex items-center gap-1 rounded px-1 hover:text-foreground"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {sorted === "asc" ? (
                            <ChevronUp className="size-3.5" />
                          ) : sorted === "desc" ? (
                            <ChevronDown className="size-3.5" />
                          ) : (
                            <ChevronsUpDown className="size-3.5 opacity-50" />
                          )}
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: Math.min(limit, 8) }).map((_, rowIdx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: deterministic skeleton placeholders
                <TableRow key={`skeleton-${rowIdx}`}>
                  {Array.from({ length: columnCount }).map((__, colIdx) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: deterministic skeleton placeholders
                    <TableCell key={`skeleton-${rowIdx}-${colIdx}`}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-24 text-center text-muted-foreground"
                >
                  {noDataMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && renderExpandedContent ? (
                    <TableRow>
                      <TableCell colSpan={columnCount} className="bg-muted/30">
                        {renderExpandedContent({
                          original: row.original,
                          getValue: (key) => row.getValue(key),
                        })}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {enablePagination ? (
        <div className="flex flex-col-reverse items-center gap-3 px-1 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4">
            <p className="whitespace-nowrap text-muted-foreground text-sm">
              {totalCount > 0
                ? `${offset + 1}–${Math.min(offset + limit, totalCount)} ຈາກ ${totalCount}`
                : "ບໍ່ມີຂໍ້ມູນ"}
            </p>
            <div className="flex items-center gap-2">
              <span className="hidden whitespace-nowrap text-muted-foreground text-sm sm:inline">
                ຕໍ່ໜ້າ
              </span>
              <Select
                value={String(limit)}
                onValueChange={(value) =>
                  onPaginationChange?.({ limit: Number(value), offset: 0 })
                }
                disabled={isLoading}
              >
                <SelectTrigger size="sm" className="w-[78px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  aria-disabled={isFirstPage}
                  className={cn(
                    "cursor-pointer select-none",
                    isFirstPage && "pointer-events-none opacity-50",
                  )}
                  onClick={(event) => {
                    event.preventDefault();
                    if (!isFirstPage) goToPage(currentPage - 1);
                  }}
                />
              </PaginationItem>

              {pageItems.map((item) =>
                typeof item === "number" ? (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href="#"
                      isActive={item === currentPage}
                      className="cursor-pointer select-none"
                      onClick={(event) => {
                        event.preventDefault();
                        goToPage(item);
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  aria-disabled={isLastPage}
                  className={cn(
                    "cursor-pointer select-none",
                    isLastPage && "pointer-events-none opacity-50",
                  )}
                  onClick={(event) => {
                    event.preventDefault();
                    if (!isLastPage) goToPage(currentPage + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </div>
  );
}

export { PAGE_SIZE_OPTIONS };
