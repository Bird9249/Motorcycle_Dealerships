import type { FilterConditionDTO } from "@/shared/contracts/base";
import {
  findCondition,
  removeConditions,
  upsertCondition,
} from "@/shared/contracts/query-helpers";
import { Button, Input, useDebounceCallback } from "@devhop/ui";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function RolesFilter() {
  const nav = useNavigate({ from: "/app/roles" });
  const search = useSearch({ from: "/app/roles" }) as {
    limit?: number;
    offset?: number;
    sort?: Array<{ field: string; dir: "asc" | "desc" }> | string;
    filters?: FilterConditionDTO[] | string;
  };

  const filters = (search.filters as FilterConditionDTO[] | undefined) ?? [];
  const nameFilter = findCondition(filters, "name");
  const [searchValue, setSearchValue] = useState<string>(
    (nameFilter?.value as string) || "",
  );

  useEffect(
    () => setSearchValue((nameFilter?.value as string) || ""),
    [nameFilter?.value],
  );

  const debounced = useDebounceCallback((val: string) => {
    setSearchValue(val);
    let nextFilters: FilterConditionDTO[] | undefined = filters;
    if (val) {
      nextFilters = upsertCondition(filters, {
        field: "name",
        op: "contains",
        value: val,
      });
    } else {
      nextFilters = removeConditions(filters, "name");
    }
    nav({
      search: {
        ...search,
        offset: 0,
        filters: nextFilters?.length ? nextFilters : undefined,
      },
    });
  }, 400);

  const hasFilter = Boolean(nameFilter?.value);

  return (
    <div
      className="mb-4 flex items-center justify-between gap-4 px-2"
      data-tourid="roles-filter"
    >
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="ຄົ້ນຫາບົດບາດ..."
          defaultValue={searchValue}
          onChange={(e) => debounced(e.target.value)}
          className="h-8 sm:max-w-2xs"
        />
      </div>
      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            nav({ search: { ...search, offset: 0, filters: undefined } })
          }
        >
          ລ້າງຕົວກອງ
        </Button>
      )}
    </div>
  );
}
