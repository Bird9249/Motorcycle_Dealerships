import type {
  FilterConditionDTO,
  OffsetPageQueryDTO,
} from "@/server/shared/contracts/base";
import {
  findCondition,
  removeConditions,
  upsertCondition,
  upsertOrGroup,
} from "@/server/shared/contracts/query-helpers";
import { SimpleSelect } from "@/web/shared/ui/SimpleSelect";
import { Button, DatePicker, Input, useDebounceCallback } from "@devhop/ui";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { format } from "date-fns";
import { XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function AuditFilter() {
  const nav = useNavigate({ from: "/app/audit" });
  const search = useSearch({ from: "/app/audit" }) as OffsetPageQueryDTO;
  const filters = (search.filters as FilterConditionDTO[] | undefined) ?? [];
  const inputRef = useRef<HTMLInputElement>(null);

  const actionFilter = findCondition(filters, "action");
  const pathFilter = findCondition(filters, "path");
  const actorFilter = findCondition(filters, "actorId");
  const resultFilter = findCondition(filters, "result");
  const fromFilter = findCondition(filters, "occurredAt");
  const toFilter = findCondition(filters, "occurredAt");

  const [searchValue, setSearchValue] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  useEffect(() => {
    const current =
      (actionFilter?.value as string) ||
      (pathFilter?.value as string) ||
      (actorFilter?.value as string) ||
      "";
    setSearchValue(current);
  }, [actionFilter?.value, pathFilter?.value, actorFilter?.value]);

  useEffect(() => {
    setFromDate(
      typeof fromFilter?.value === "string"
        ? fromFilter.value.slice(0, 10)
        : "",
    );
    setToDate(
      typeof toFilter?.value === "string" ? toFilter.value.slice(0, 10) : "",
    );
  }, [fromFilter?.value, toFilter?.value]);

  const debounced = useDebounceCallback((val: string) => {
    setSearchValue(val);

    let nextFilters: FilterConditionDTO[] | undefined = filters;
    if (val) {
      nextFilters = upsertOrGroup(filters, [
        { field: "action", op: "contains", value: val },
        { field: "path", op: "contains", value: val },
        { field: "actorId", op: "contains", value: val },
      ]);
    } else {
      nextFilters = removeConditions(filters, "action");
      nextFilters = removeConditions(nextFilters, "path");
      nextFilters = removeConditions(nextFilters, "actorId");
    }
    nav({
      search: {
        ...search,
        offset: 0,
        filters: nextFilters?.length ? nextFilters : undefined,
      },
    });
  }, 400);

  const hasFilter =
    !!resultFilter?.value ||
    !!fromFilter?.value ||
    !!toFilter?.value ||
    !!searchValue;

  return (
    <div className="mb-4 flex flex-col gap-2 px-2">
      <div className="flex items-center justify-between gap-4 max-sm:flex-col">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            placeholder="ຄົ້ນຫາການກະທໍາ, ເສັ້ນທາງ, ຜູ້ກະທໍາ…"
            defaultValue={searchValue}
            onChange={(e) => debounced(e.target.value)}
            className="h-8 sm:max-w-2xs"
            ref={inputRef}
          />

          <SimpleSelect
            value={(resultFilter?.value as string) ?? "all"}
            onValueChange={(val) => {
              let nextFilters: FilterConditionDTO[] | undefined = filters;
              if (val === "all") {
                nextFilters = removeConditions(filters, "result");
              } else {
                nextFilters = upsertCondition(filters, {
                  field: "result",
                  op: "eq",
                  value: val,
                });
              }
              nav({
                search: {
                  ...search,
                  offset: 0,
                  filters: nextFilters?.length ? nextFilters : undefined,
                },
              });
            }}
            placeholder="ຜົນລັບ"
            className="!h-8 w-full sm:w-36"
            options={[
              { value: "all", label: "ທຸກຜົນລັບ" },
              { value: "success", label: "ສໍາເລັດ" },
              { value: "failed", label: "ລົ້ມເຫຼວ" },
            ]}
          />

          <DatePicker
            mode="range"
            value={{
              from: fromDate ? new Date(fromDate) : undefined,
              to: toDate ? new Date(toDate) : undefined,
            }}
            onChange={(range) => {
              const from: Date | undefined = Array.isArray(range)
                ? range[0]
                : range?.from;
              const to: Date | undefined = Array.isArray(range)
                ? range[1]
                : range?.to;
              const fromStr = from ? format(from, "yyyy-MM-dd") : "";
              const toStr = to ? format(to, "yyyy-MM-dd") : "";
              setFromDate(fromStr);
              setToDate(toStr);
              let nextFilters: FilterConditionDTO[] | undefined = filters;
              nextFilters = removeConditions(nextFilters, "occurredAt");
              const dateRange: FilterConditionDTO[] = [];
              if (fromStr)
                dateRange.push({
                  field: "occurredAt",
                  op: "gte",
                  value: `${fromStr} 00:00:00`,
                });

              if (toStr)
                dateRange.push({
                  field: "occurredAt",
                  op: "lte",
                  value: `${toStr} 23:59:59`,
                });

              nextFilters = upsertCondition(nextFilters, {
                field: "occurredAt",
                op: "and",
                value: dateRange as any,
              });
              nav({
                search: {
                  ...search,
                  offset: 0,
                  filters: nextFilters?.length ? nextFilters : undefined,
                },
              });
            }}
            placeholder="ຊ່ວງວັນທີ"
            className="h-8 w-full sm:w-36"
          />
        </div>

        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (inputRef.current) inputRef.current.value = "";
              nav({ search: { ...search, filters: undefined, offset: 0 } });
            }}
            className="max-sm:w-full"
          >
            <XIcon className="h-4 w-4" /> ລ້າງ
          </Button>
        )}
      </div>
    </div>
  );
}
