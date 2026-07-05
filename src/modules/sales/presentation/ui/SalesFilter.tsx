import { useNavigate, useSearch } from "@tanstack/react-router";
import { FilterIcon, SearchIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  DatePicker,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useDebounceCallback,
} from "@/components/kit";
import type { SalesOrdersListQueryDTO } from "@/modules/sales/domain/contracts";
import { formatDateForInput, parseISO } from "@/shared/lib/date-time";
import { PAYMENT_TYPE_OPTIONS, SALES_STATUS_OPTIONS } from "../lib/labels";

export function SalesFilter() {
  const nav = useNavigate({ from: "/app/sales" });
  const search = useSearch({ from: "/app/sales" }) as SalesOrdersListQueryDTO;

  const orderFilter = search.filters?.find(
    (f) => f.field === "orderNumber" && f.op === "contains",
  );
  const [searchValue, setSearchValue] = useState<string>(
    (orderFilter?.value as string) || "",
  );
  const [dateFrom, setDateFrom] = useState(search.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(search.dateTo ?? "");

  useEffect(
    () => setSearchValue((orderFilter?.value as string) || ""),
    [orderFilter?.value],
  );

  useEffect(() => {
    setDateFrom(search.dateFrom ?? "");
    setDateTo(search.dateTo ?? "");
  }, [search.dateFrom, search.dateTo]);

  const debouncedSearch = useDebounceCallback((val: string) => {
    setSearchValue(val);
    nav({
      search: {
        ...search,
        offset: 0,
        filters: val
          ? [{ field: "orderNumber", op: "contains", value: val }]
          : undefined,
      },
    });
  }, 400);

  const hasDateFilter = !!(search.dateField && (search.dateFrom || search.dateTo));

  const activeFilters =
    (search.status ? 1 : 0) +
    (search.paymentType ? 1 : 0) +
    (searchValue ? 1 : 0) +
    (hasDateFilter ? 1 : 0);

  const clearFilters = () => {
    setSearchValue("");
    setDateFrom("");
    setDateTo("");
    nav({
      search: {
        offset: 0,
        limit: search.limit ?? 20,
      },
    });
  };

  const updateDateFilter = (
    patch: Partial<
      Pick<SalesOrdersListQueryDTO, "dateField" | "dateFrom" | "dateTo">
    >,
  ) => {
    nav({
      search: {
        ...search,
        offset: 0,
        ...patch,
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 border-b bg-muted/20 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <FilterIcon className="size-4 text-muted-foreground" />
        <span className="font-medium text-sm">ກອງຂໍ້ມູນ</span>
        {activeFilters > 0 ? (
          <Badge variant="secondary">{activeFilters} ຕົວກອງ</Badge>
        ) : null}
        {activeFilters > 0 ? (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <XIcon className="size-4" />
            ລ້າງ
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>ເລກທີຄຳສັ່ງ</Label>
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="SO-..."
              defaultValue={searchValue}
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </InputGroup>
        </div>

        <div className="space-y-2">
          <Label>ສະຖານະ</Label>
          <Select
            value={search.status ?? "all"}
            onValueChange={(value) =>
              nav({
                search: {
                  ...search,
                  offset: 0,
                  status: value === "all" ? undefined : (value as never),
                },
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="ທຸກສະຖານະ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ທຸກສະຖານະ</SelectItem>
              {SALES_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>ປະເພດຊຳລະ</Label>
          <Select
            value={search.paymentType ?? "all"}
            onValueChange={(value) =>
              nav({
                search: {
                  ...search,
                  offset: 0,
                  paymentType: value === "all" ? undefined : (value as never),
                },
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="ທຸກປະເພດ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ທຸກປະເພດ</SelectItem>
              {PAYMENT_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>ຊ່ວງວັນທີ (ຕາມ)</Label>
          <Select
            value={search.dateField ?? "none"}
            onValueChange={(value) =>
              updateDateFilter({
                dateField:
                  value === "none" ? undefined : (value as "createdAt" | "soldAt"),
                dateFrom: value === "none" ? undefined : search.dateFrom,
                dateTo: value === "none" ? undefined : search.dateTo,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="ບໍ່ກອງວັນທີ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">ບໍ່ກອງວັນທີ</SelectItem>
              <SelectItem value="createdAt">ວັນທີສ້າງ</SelectItem>
              <SelectItem value="soldAt">ວັນທີຂາຍ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>ຊ່ວງວັນທີ</Label>
          <DatePicker
            mode="range"
            disabled={!search.dateField}
            placeholder="ເລືອກຊ່ວງວັນທີ"
            className="w-full"
            value={{
              from: dateFrom ? parseISO(dateFrom) : undefined,
              to: dateTo ? parseISO(dateTo) : undefined,
            }}
            onChange={(range) => {
              const fromStr = range?.from
                ? formatDateForInput(range.from)
                : undefined;
              const toStr = range?.to ? formatDateForInput(range.to) : undefined;
              setDateFrom(fromStr ?? "");
              setDateTo(toStr ?? "");
              updateDateFilter({ dateFrom: fromStr, dateTo: toStr });
            }}
          />
        </div>
      </div>
    </div>
  );
}
