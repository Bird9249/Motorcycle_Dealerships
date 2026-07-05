import { useNavigate, useSearch } from "@tanstack/react-router";
import { FilterIcon, SearchIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
  useDebounceCallback,
} from "@/components/kit";
import type { VehiclesListQueryDTO } from "@/modules/inventory/domain/contracts";
import { useBrandsQuery, useModelsQuery } from "../api/queries";
import {
  REGISTRATION_READY_OPTIONS,
  VEHICLE_STATUS_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
} from "../lib/labels";

export function VehiclesFilter() {
  const nav = useNavigate({ from: "/app/inventory/vehicles" });
  const search = useSearch({
    from: "/app/inventory/vehicles",
  }) as VehiclesListQueryDTO;

  const brands = useBrandsQuery();
  const models = useModelsQuery({
    brandId: search.brandId || undefined,
  });

  const chassisFilter = search.filters?.find(
    (f) => f.field === "chassisNumber" && f.op === "contains",
  );
  const [searchValue, setSearchValue] = useState<string>(
    (chassisFilter?.value as string) || "",
  );

  useEffect(
    () => setSearchValue((chassisFilter?.value as string) || ""),
    [chassisFilter?.value],
  );

  const debouncedSearch = useDebounceCallback((val: string) => {
    setSearchValue(val);
    nav({
      search: {
        ...search,
        offset: 0,
        filters: val
          ? [{ field: "chassisNumber", op: "contains", value: val }]
          : undefined,
      },
    });
  }, 400);

  const brandOptions = useMemo(
    () => [
      { value: "all", label: "ທຸກຍີ່ຫໍ້" },
      ...(brands.data?.map((b) => ({ value: b.id, label: b.name })) ?? []),
    ],
    [brands.data],
  );

  const modelOptions = useMemo(
    () => [
      { value: "all", label: "ທຸກລຸ່ນ" },
      ...(models.data?.map((m) => ({ value: m.id, label: m.name })) ?? []),
    ],
    [models.data],
  );

  const activeFilterCount = [
    search.status,
    search.brandId,
    search.modelId,
    search.vehicleType,
    search.registrationReady,
    chassisFilter?.value,
  ].filter(Boolean).length;

  const updateSearch = (patch: Partial<VehiclesListQueryDTO>) => {
    nav({
      search: {
        ...search,
        offset: 0,
        ...patch,
      },
    });
  };

  const clearFilters = () => {
    nav({
      search: {
        limit: search.limit,
        offset: 0,
      },
    });
  };

  return (
    <div
      className="border-b bg-muted/30 px-4 py-4"
      data-tourid="vehicles-filter"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <FilterIcon className="size-4" />
          <span className="font-medium">ກອງຂໍ້ມູນ</span>
          {activeFilterCount > 0 ? (
            <Badge variant="secondary" className="tabular-nums">
              {activeFilterCount} ຕົວກອງ
            </Badge>
          ) : null}
        </div>
        {activeFilterCount > 0 ? (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <XIcon className="size-4" />
            ລ້າງທັງໝົດ
          </Button>
        ) : null}
      </div>

      <Tabs
        value={search.status ?? "all"}
        onValueChange={(val) =>
          updateSearch({ status: val === "all" ? undefined : val })
        }
        className="mb-4"
      >
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          <TabsTrigger
            value="all"
            className="rounded-full border bg-background px-3 py-1.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            ທຸກສະຖານະ
          </TabsTrigger>
          {VEHICLE_STATUS_OPTIONS.map((opt) => (
            <TabsTrigger
              key={opt.value}
              value={opt.value}
              className="rounded-full border bg-background px-3 py-1.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {opt.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]">
        <div className="space-y-1.5">
          <Label htmlFor="vehicles-chassis-search" className="text-xs">
            ຄົ້ນຫາເລກຖັງ
          </Label>
          <InputGroup className="h-9 bg-background">
            <InputGroupAddon align="inline-start">
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="vehicles-chassis-search"
              placeholder="ພິມເລກຖັງ..."
              value={searchValue}
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </InputGroup>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">ປະເພດ</Label>
          <Select
            value={search.vehicleType ?? "all"}
            onValueChange={(val) =>
              updateSearch({
                vehicleType: val === "all" ? undefined : (val as "ice" | "ev"),
              })
            }
          >
            <SelectTrigger className="h-9 w-full bg-background">
              <SelectValue placeholder="ປະເພດ" />
            </SelectTrigger>
            <SelectContent>
              {VEHICLE_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">ເອກະສານທະບຽນ</Label>
          <Select
            value={search.registrationReady ?? "all"}
            onValueChange={(val) =>
              updateSearch({
                registrationReady:
                  val === "all" ? undefined : (val as "ready" | "not_ready"),
              })
            }
          >
            <SelectTrigger className="h-9 w-full bg-background">
              <SelectValue placeholder="ເອກະສານ" />
            </SelectTrigger>
            <SelectContent>
              {REGISTRATION_READY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">ຍີ່ຫໍ້</Label>
          <Select
            value={search.brandId ?? "all"}
            onValueChange={(val) =>
              updateSearch({
                brandId: val === "all" ? undefined : val,
                modelId: undefined,
              })
            }
          >
            <SelectTrigger className="h-9 w-full bg-background">
              <SelectValue placeholder="ຍີ່ຫໍ້" />
            </SelectTrigger>
            <SelectContent>
              {brandOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">ລຸ່ນ</Label>
          <Select
            value={search.modelId ?? "all"}
            onValueChange={(val) =>
              updateSearch({ modelId: val === "all" ? undefined : val })
            }
            disabled={!search.brandId && modelOptions.length <= 1}
          >
            <SelectTrigger className="h-9 w-full bg-background">
              <SelectValue placeholder="ລຸ່ນ" />
            </SelectTrigger>
            <SelectContent>
              {modelOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
