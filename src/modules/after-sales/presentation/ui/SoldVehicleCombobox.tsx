import type { VehicleListItem } from "@/modules/inventory/domain/types";
import { inventoryApi } from "@/modules/inventory/presentation/api/client";
import { InfiniteCombobox } from "@/shared/ui/InfiniteCombobox";

const QUERY_KEY = ["after-sales", "sold-vehicle-combobox"] as const;

async function fetchSoldVehicles({
  search,
  pageParam,
}: {
  search: string;
  pageParam: number;
}) {
  const limit = 20;
  const offset = (pageParam - 1) * limit;
  const filters = search.trim()
    ? [
        {
          field: "chassisNumber",
          op: "contains" as const,
          value: search.trim(),
        },
      ]
    : undefined;

  const result = await inventoryApi.listVehicles({
    limit,
    offset,
    status: "sold",
    filters,
  });

  return {
    items: result.data,
    nextPage: offset + limit < result.meta.total ? pageParam + 1 : null,
  };
}

type SoldVehicleComboboxProps = {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
};

export function SoldVehicleCombobox({
  value,
  onValueChange,
  className,
}: SoldVehicleComboboxProps) {
  return (
    <InfiniteCombobox<VehicleListItem>
      queryKey={[...QUERY_KEY]}
      queryFn={fetchSoldVehicles}
      preloadQueryFn={async (id) => {
        if (!id) return null;
        try {
          const vehicle = await inventoryApi.getVehicle(id);
          if (vehicle.status !== "sold") return null;
          return vehicle;
        } catch {
          return null;
        }
      }}
      getValue={(item) => item.id}
      getLabel={(item) =>
        `${item.brand.name} ${item.model.name} · ${item.chassisNumber ?? item.id}`
      }
      value={value}
      onValueChange={onValueChange}
      placeholder="ຄົ້ນຫາເລກຖັງ..."
      className={className}
      clearable
    />
  );
}
