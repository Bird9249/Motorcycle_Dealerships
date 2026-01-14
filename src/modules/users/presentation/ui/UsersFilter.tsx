import type { RoleDTO } from "@/modules/roles/presentation/api/client";
import type {
  FilterConditionDTO,
  OffsetPageQueryDTO,
} from "@/shared/contracts/base";
import {
  findCondition,
  removeConditions,
  upsertCondition,
  upsertOrGroup,
} from "@/shared/contracts/query-helpers";
import { config } from "@/shared/lib/config";
import { fetchLookupForInfinite, hydrateLookupItem } from "@/shared/lib/utils";
import { InfiniteCombobox } from "@/shared/ui/InfiniteCombobox";
import { SimpleSelect } from "@/shared/ui/SimpleSelect";
import {
  Button,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  useDebounceCallback,
} from "@devhop/ui";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";

type UsersFilterProps = {
  roles: string[];
};

export function UsersFilter({ roles }: UsersFilterProps) {
  const nav = useNavigate({ from: "/app/users" });
  const search = useSearch({ from: "/app/users" }) as OffsetPageQueryDTO;
  const filters = (search.filters as FilterConditionDTO[] | undefined) ?? [];

  const nameFilter = findCondition(filters, "name");
  const roleFilter = findCondition(filters, "role");
  const roleIdFilter = findCondition(filters, "roleId");
  const bannedFilter = findCondition(filters, "banned");

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
      nextFilters = upsertOrGroup(filters, [
        { field: "name", op: "contains", value: val },
        { field: "email", op: "contains", value: val },
        { field: "id", op: "contains", value: val },
      ]);
    } else {
      nextFilters = removeConditions(filters, "name");
      nextFilters = removeConditions(nextFilters, "email");
    }
    nav({
      search: {
        ...search,
        offset: 0,
        filters: nextFilters?.length ? nextFilters : undefined,
      },
    });
  }, 400);

  const roleValue = roleFilter?.value as string;
  const roleIdValue = roleIdFilter?.value as string;

  const bannedValue =
    typeof bannedFilter?.value === "boolean" ? String(bannedFilter.value) : "";
  const hasFilter =
    !!roleFilter?.value ||
    !!roleIdFilter?.value ||
    !!nameFilter?.value ||
    !!bannedValue;

  return (
    <div className="mb-4 flex flex-col gap-2 px-2" data-tourid="users-filter">
      <Tabs
        value={roleValue}
        onValueChange={(val) => {
          let nextFilters: FilterConditionDTO[] | undefined = filters;
          if (val === "all") {
            nextFilters = removeConditions(filters, "role");
          } else {
            nextFilters = upsertCondition(filters, {
              field: "role",
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
      >
        <TabsList>
          <TabsTrigger value="all">ທັງໝົດ</TabsTrigger>
          {roles.map((r) => (
            <TabsTrigger className="capitalize" key={r} value={r}>
              {r}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center justify-between gap-4 max-sm:flex-col">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            placeholder="ຄົ້ນຫາຜູ້ໃຊ້..."
            defaultValue={searchValue}
            onChange={(e) => debounced(e.target.value)}
            className="h-8 sm:max-w-2xs"
          />
          <InfiniteCombobox<RoleDTO>
            queryKey={["roles"]}
            className="h-8 w-full sm:w-40"
            value={roleIdValue}
            onValueChange={(val) => {
              console.log("val", val);

              let nextFilters: FilterConditionDTO[] | undefined = filters;

              if (!val) {
                nextFilters = removeConditions(filters, "roleId");
              } else {
                nextFilters = upsertCondition(filters, {
                  field: "roleId",
                  op: "eq",
                  value: val || "",
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
            queryFn={(args) =>
              fetchLookupForInfinite(`${config.apiUrl}/rbac/roles/lookup`, args)
            }
            preloadQueryFn={(id) =>
              hydrateLookupItem(`${config.apiUrl}/rbac/roles/lookup`, id)
            }
            getLabel={(item) => item.name}
            getValue={(item) => item.id}
            clearable
            placeholder="ເລືອກບົດບາດ..."
          />

          <SimpleSelect
            value={bannedValue}
            onValueChange={(val) => {
              let nextFilters: FilterConditionDTO[] | undefined = filters;
              if (val === "all") {
                nextFilters = removeConditions(filters, "banned");
              } else {
                nextFilters = upsertCondition(filters, {
                  field: "banned",
                  op: "eq",
                  value: val === "true",
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
            placeholder="ສະຖານະ"
            className="h-8 w-full sm:w-32"
            options={[
              { value: "all", label: "ທັງໝົດ" },
              { value: "false", label: "ໃຊ້ງານປົກກະຕິ" },
              { value: "true", label: "ຖືກລະງັບ" },
            ]}
          />
        </div>
        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              nav({ search: { ...search, filters: undefined, offset: 0 } })
            }
            className="max-sm:w-full"
          >
            <XIcon className="h-4 w-4" /> ລ້າງ
          </Button>
        )}
      </div>
    </div>
  );
}
