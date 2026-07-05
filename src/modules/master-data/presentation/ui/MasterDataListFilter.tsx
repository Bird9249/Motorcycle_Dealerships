import { SearchIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
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
import type { ActiveFilter } from "@/modules/master-data/domain/contracts/common";
import { ACTIVE_FILTER_OPTIONS } from "../lib/labels";

type MasterDataListFilterProps = {
  name: string;
  active: ActiveFilter;
  onNameChange: (name: string) => void;
  onActiveChange: (active: ActiveFilter) => void;
  children?: React.ReactNode;
};

export function MasterDataListFilter({
  name,
  active,
  onNameChange,
  onActiveChange,
  children,
}: MasterDataListFilterProps) {
  const [searchValue, setSearchValue] = useState(name);

  useEffect(() => setSearchValue(name), [name]);

  const debouncedSearch = useDebounceCallback((val: string) => {
    onNameChange(val);
  }, 400);

  return (
    <div
      className="flex flex-col gap-3 border-b px-4 pb-3"
      data-tourid="master-data-filter"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <Label className="mb-1.5 block text-muted-foreground text-xs">
            ຄົ້ນຫາຊື່
          </Label>
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="ພິມຊື່..."
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                debouncedSearch(e.target.value);
              }}
            />
            {searchValue ? (
              <InputGroupAddon align="inline-end">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSearchValue("");
                    onNameChange("");
                  }}
                  aria-label="ລ້າງການຄົ້ນຫາ"
                >
                  <XIcon className="size-4" />
                </button>
              </InputGroupAddon>
            ) : null}
          </InputGroup>
        </div>

        {children}

        <div>
          <Label className="mb-1.5 block text-muted-foreground text-xs">
            ສະຖານະ
          </Label>
          <Tabs
            value={active ?? "all"}
            onValueChange={(v) => onActiveChange(v as ActiveFilter)}
          >
            <TabsList>
              {ACTIVE_FILTER_OPTIONS.map(({ value, label }) => (
                <TabsTrigger key={value} value={value ?? "all"}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

type MasterDataSelectFilterProps = {
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string) => void;
};

export function MasterDataSelectFilter({
  label,
  value,
  options,
  onChange,
}: MasterDataSelectFilterProps) {
  return (
    <div className="min-w-[160px]">
      <Label className="mb-1.5 block text-muted-foreground text-xs">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
