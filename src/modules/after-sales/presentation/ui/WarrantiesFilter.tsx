import { useNavigate, useSearch } from "@tanstack/react-router";
import { FilterIcon, XIcon } from "lucide-react";
import {
  Badge,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/kit";
import type { WarrantiesListQueryDTO } from "@/modules/after-sales/domain/contracts";
import {
  WARRANTY_STATUS_OPTIONS,
  WARRANTY_TYPE_OPTIONS,
} from "../lib/labels";

export function WarrantiesFilter() {
  const nav = useNavigate({ from: "/app/after-sales/warranties" });
  const search = useSearch({
    from: "/app/after-sales/warranties",
  }) as WarrantiesListQueryDTO;

  const activeFilters =
    (search.warrantyType ? 1 : 0) +
    (search.status ? 1 : 0) +
    (search.expiringSoon ? 1 : 0);

  const clearFilters = () => {
    nav({
      search: {
        offset: 0,
        limit: search.limit ?? 20,
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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label>ປະເພດປະກັນ</Label>
          <Select
            value={search.warrantyType ?? "all"}
            onValueChange={(value) =>
              nav({
                search: {
                  ...search,
                  warrantyType:
                    value === "all"
                      ? undefined
                      : (value as WarrantiesListQueryDTO["warrantyType"]),
                  offset: 0,
                },
              })
            }
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="ທັງໝົດ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ທັງໝົດ</SelectItem>
              {WARRANTY_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>ສະຖານະ</Label>
          <Select
            value={search.status ?? "all"}
            onValueChange={(value) =>
              nav({
                search: {
                  ...search,
                  status:
                    value === "all"
                      ? undefined
                      : (value as WarrantiesListQueryDTO["status"]),
                  offset: 0,
                },
              })
            }
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="ສະຖານະທັງໝົດ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ສະຖານະທັງໝົດ</SelectItem>
              {WARRANTY_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>ໝົດອາຍຸໃນ 30 ວັນ</Label>
          <Select
            value={search.expiringSoon ?? "all"}
            onValueChange={(value) =>
              nav({
                search: {
                  ...search,
                  expiringSoon: value === "soon" ? "true" : undefined,
                  offset: 0,
                },
              })
            }
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="ທັງໝົດ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ທັງໝົດ</SelectItem>
              <SelectItem value="soon">ໃກ້ໝົດອາຍຸ (≤30 ວັນ)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
