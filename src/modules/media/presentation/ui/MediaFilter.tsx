import type { UsersListResult } from "@/modules/users/domain/types";
import { usersApi } from "@/modules/users/presentation/api/client";
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

type UserItem = UsersListResult["data"][number];

export function MediaFilter() {
  const nav = useNavigate({ from: "/app/media" });
  const search = useSearch({ from: "/app/media" }) as OffsetPageQueryDTO;
  const filters = (search.filters as FilterConditionDTO[] | undefined) ?? [];

  const fileNameFilter = findCondition(filters, "fileName");
  const mimeTypeFilter = findCondition(filters, "mimeType");
  const createdByFilter = findCondition(filters, "createdBy");
  const archivedFilter = findCondition(filters, "archived");

  const debounced = useDebounceCallback((val: string) => {
    const next = val
      ? upsertOrGroup(filters, [
          { field: "fileName", op: "contains", value: val },
          { field: "altText", op: "contains", value: val },
        ])
      : removeConditions(removeConditions(filters, "fileName"), "altText");
    nav({
      search: {
        ...search,
        offset: 0,
        filters: next?.length ? next : undefined,
      },
    });
  }, 400);

  const archivedValue =
    typeof archivedFilter?.value === "boolean"
      ? String(archivedFilter.value)
      : "all";

  return (
    <div className="mb-4 flex flex-col gap-2 px-2" data-tourid="media-filter">
      <Tabs
        value={archivedValue}
        onValueChange={(val) => {
          const next =
            val === "all"
              ? removeConditions(filters, "archived")
              : upsertCondition(filters, {
                  field: "archived",
                  op: "eq",
                  value: val === "true",
                });
          nav({
            search: {
              ...search,
              offset: 0,
              filters: next?.length ? next : undefined,
            },
          });
        }}
      >
        <TabsList>
          <TabsTrigger value="all">ທັງໝົດ</TabsTrigger>
          <TabsTrigger value="false">ທີ່ໃຊ້ຢູ່</TabsTrigger>
          <TabsTrigger value="true">ຖືກເກັບໄວ້</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center justify-between gap-4 max-sm:flex-col">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            placeholder="ຄົ້ນຫາ..."
            onChange={(e) => debounced(e.target.value)}
            className="h-8 sm:max-w-2xs"
          />

          <SimpleSelect
            onValueChange={(val) => {
              const next =
                val === "all"
                  ? removeConditions(filters, "mimeType")
                  : upsertCondition(filters, {
                      field: "mimeType",
                      op: "startsWith",
                      value: val,
                    });
              nav({
                search: {
                  ...search,
                  offset: 0,
                  filters: next?.length ? next : undefined,
                },
              });
            }}
            placeholder="ປະເພດ"
            className="h-8 w-full sm:w-32"
            value={
              mimeTypeFilter?.value
                ? String(mimeTypeFilter.value).split("/")[0]
                : "all"
            }
            options={[
              { value: "all", label: "ທັງໝົດ" },
              { value: "image", label: "ຮູບພາບ" },
              { value: "application", label: "ເອກະສານ" },
            ]}
          />

          <InfiniteCombobox<UserItem>
            queryKey={["users", "lookup"]}
            className="h-8 w-full sm:w-40"
            value={(createdByFilter?.value as string) ?? ""}
            onValueChange={(val) => {
              const next = val
                ? upsertCondition(filters, {
                    field: "createdBy",
                    op: "eq",
                    value: val,
                  })
                : removeConditions(filters, "createdBy");
              nav({
                search: {
                  ...search,
                  offset: 0,
                  filters: next?.length ? next : undefined,
                },
              });
            }}
            queryFn={async ({ search: searchQuery, pageParam }) => {
              const result = await usersApi.list({
                limit: 20,
                offset: (pageParam - 1) * 20,
                filters: searchQuery
                  ? [
                      {
                        field: "name",
                        op: "contains",
                        value: searchQuery,
                      },
                    ]
                  : undefined,
              });
              return {
                items: result.data,
                nextPage:
                  result.data.length === 20 &&
                  result.meta.total > pageParam * 20
                    ? pageParam + 1
                    : null,
              };
            }}
            preloadQueryFn={async (id) => {
              const result = await usersApi.get(id);
              return result ?? undefined;
            }}
            getLabel={(item) => item.name || item.email}
            getValue={(item) => item.id}
            clearable
            placeholder="ອັບໂຫຼດໂດຍ..."
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            nav({ search: { ...search, filters: undefined, offset: 0 } })
          }
          className="max-sm:w-full"
        >
          ລ້າງ
        </Button>
      </div>
    </div>
  );
}
