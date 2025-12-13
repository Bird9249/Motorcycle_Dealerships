import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
  useDebounceCallback,
} from "@devhop/ui";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Check, ChevronsUpDown } from "lucide-react";
import React, { useRef } from "react";

interface InfiniteComboboxProps<T> {
  queryKey: Array<string>;
  queryFn: (params: {
    search: string;
    pageParam: number;
  }) => Promise<{ items: Array<T>; nextPage: number | null }>;
  preloadQueryFn: (id: string) => Promise<T | null>;
  getLabel: (item: T) => string;
  getValue: (item: T) => string;
  getDisabled?: (item: T) => boolean;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  clearable?: boolean;
}

export function InfiniteCombobox<T>({
  queryKey,
  queryFn,
  preloadQueryFn,
  getLabel,
  getValue,
  value,
  onValueChange,
  placeholder = "ເລືອກ...",
  className,
  clearable,
  getDisabled,
}: InfiniteComboboxProps<T>) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const handleWheel = React.useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (scrollContainerRef.current) {
        e.stopPropagation();
        scrollContainerRef.current.scrollTop += e.deltaY;
      }
    },
    [],
  );

  const debounced = useDebounceCallback(
    (...args: Array<unknown>) => setSearch(args[0] as string),
    500,
  );

  const { data: selectedItem } = useQuery({
    queryKey: [...queryKey, "preload", value],
    queryFn: () => preloadQueryFn(value),
    enabled: !!value,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching } =
    useInfiniteQuery({
      queryKey: [...queryKey, search],
      queryFn: ({ pageParam = 1 }) => queryFn({ search, pageParam }),
      getNextPageParam: (lastPage) => lastPage.nextPage,
      initialPageParam: 1,
      enabled: open,
      refetchOnWindowFocus: false,
    });

  const items = data ? data.pages.flatMap((page) => page.items) : [];

  const mergedItems = React.useMemo(() => {
    if (!value) return items;
    const exists = items.some((item) => getValue(item) === value);
    if (!exists && selectedItem) {
      return [selectedItem, ...items];
    }
    return items;
  }, [items, value, selectedItem, getValue]);

  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? mergedItems.length + 1 : mergedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5,
  });

  React.useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!lastItem) return;

    if (
      lastItem.index >= mergedItems.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    mergedItems.length,
    isFetchingNextPage,
    rowVirtualizer.getVirtualItems(),
  ]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearch("");
    }
  };

  const selected = mergedItems.find((item) => getValue(item) === value);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          ref={btnRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex w-full items-center justify-between">
            <span className="truncate">
              {selected
                ? getLabel(selected)
                : value
                  ? "ກໍາລັງໂຫຼດ..."
                  : placeholder}
            </span>
            <div className="flex items-center space-x-2">
              <ChevronsUpDown className="opacity-50" />
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[250px] p-0"
        style={{ width: btnRef.current?.offsetWidth }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="ຄົ້ນຫາ..."
            className="h-9"
            onValueChange={(v) => debounced(v)}
          />
          <CommandList ref={parentRef} className="max-h-[300px] overflow-auto">
            {isFetching && mergedItems.length === 0 && (
              <CommandEmpty>ກໍາລັງໂຫຼດ...</CommandEmpty>
            )}
            {!isFetching && mergedItems.length === 0 && (
              <CommandEmpty>ບໍ່ພົບລາຍການ</CommandEmpty>
            )}
            <CommandGroup>
              <div
                onWheel={handleWheel}
                ref={scrollContainerRef}
                style={{
                  height: rowVirtualizer.getTotalSize(),
                  width: "100%",
                  position: "relative",
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const isLoaderRow = virtualRow.index > mergedItems.length - 1;
                  const item = mergedItems[virtualRow.index];

                  return (
                    <div
                      key={virtualRow.index}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {isLoaderRow ? (
                        hasNextPage ? (
                          "ກໍາລັງໂຫຼດເພີ່ມ..."
                        ) : (
                          "ບໍ່ມີລາຍການເພີ່ມເຕີມ"
                        )
                      ) : (
                        <CommandItem
                          value={getValue(item)}
                          onSelect={() => {
                            onValueChange(getValue(item));
                            setOpen(false);
                          }}
                          disabled={getDisabled ? getDisabled(item) : false}
                        >
                          <div className="truncate" title={getLabel(item)}>
                            {getLabel(item)}
                          </div>
                          <Check
                            className={cn(
                              "ml-auto",
                              value === getValue(item)
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      )}
                    </div>
                  );
                })}
              </div>
            </CommandGroup>
          </CommandList>
        </Command>

        <div className="px-2 pb-2">
          {clearable && value && (
            <Button
              className="w-full"
              size={"sm"}
              variant={"outline"}
              onClick={() => onValueChange("")}
            >
              ລ້າງ
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
