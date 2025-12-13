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
} from "@devhop/ui";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

interface InfiniteMultiComboboxProps<T> {
  queryKey: Array<string>;
  queryFn: (params: {
    search: string;
    pageParam: number;
  }) => Promise<{ items: Array<T>; nextPage: number | null }>;
  preloadQueryFn: (ids: string[]) => Promise<Array<T>>;
  getLabel: (item: T) => string;
  getValue: (item: T) => string;
  values: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  clearable?: boolean;
}

export function InfiniteMultiCombobox<T>({
  queryKey,
  queryFn,
  preloadQueryFn,
  getLabel,
  getValue,
  values,
  onValuesChange,
  placeholder = "ເລືອກ...",
  className,
  clearable,
}: InfiniteMultiComboboxProps<T>) {
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const parentRef = React.useRef<HTMLDivElement>(null);

  const { data: selectedItems } = useQuery({
    queryKey: [...queryKey, "preload", values],
    queryFn: () => preloadQueryFn(values),
    enabled: values.length > 0,
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
    if (values.length === 0) return items;
    const existingIds = items.map((item) => getValue(item));
    const preloadItems =
      selectedItems?.filter((item) => !existingIds.includes(getValue(item))) ||
      [];
    return [...preloadItems, ...items];
  }, [items, values, selectedItems, getValue]);

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? mergedItems.length + 1 : mergedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5,
  });

  React.useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

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
            <span>
              {values.length > 0
                ? selectedItems?.map((item) => getLabel(item)).join(", ") ||
                  "ກໍາລັງໂຫຼດ..."
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
            onValueChange={(v) => setSearch(v)}
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
                            if (values.includes(getValue(item))) {
                              onValuesChange(
                                values.filter((v) => v !== getValue(item)),
                              );
                            } else {
                              onValuesChange([...values, getValue(item)]);
                            }
                          }}
                        >
                          {getLabel(item)}
                          <Check
                            className={cn(
                              "ml-auto",
                              values.includes(getValue(item))
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
          {clearable && values.length > 0 && (
            <Button
              className="w-full"
              size="sm"
              variant="outline"
              onClick={() => onValuesChange([])}
            >
              ລ້າງທັງໝົດ
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
