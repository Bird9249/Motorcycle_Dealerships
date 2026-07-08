import type { SalesOrderListItem } from "@/modules/sales/presentation/api/client";
import { salesApi } from "@/modules/sales/presentation/api/client";
import { PAYMENT_TYPE_LABELS } from "@/modules/sales/presentation/lib/labels";
import { InfiniteCombobox } from "@/shared/ui/InfiniteCombobox";

const QUERY_KEY = ["payments", "sales-order-combobox"] as const;

async function fetchPayableOrders({
  search,
  pageParam,
}: {
  search: string;
  pageParam: number;
}) {
  const limit = 20;
  const offset = (pageParam - 1) * limit;
  const filters = search.trim()
    ? [{ field: "orderNumber", op: "contains" as const, value: search.trim() }]
    : undefined;

  const result = await salesApi.listOrders({
    limit,
    offset,
    status: "confirmed",
    filters,
  });

  return {
    items: result.data,
    nextPage:
      offset + limit < result.meta.total ? pageParam + 1 : null,
  };
}

type SalesOrderComboboxProps = {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
};

export function SalesOrderCombobox({
  value,
  onValueChange,
  className,
}: SalesOrderComboboxProps) {
  return (
    <InfiniteCombobox<SalesOrderListItem>
      queryKey={[...QUERY_KEY]}
      queryFn={fetchPayableOrders}
      preloadQueryFn={async (id) => {
        if (!id) return null;
        try {
          const order = await salesApi.getOrder(id);
          if (order.status === "draft" || order.status === "cancelled") {
            return null;
          }
          return order;
        } catch {
          return null;
        }
      }}
      getValue={(item) => item.id}
      getLabel={(item) =>
        `${item.orderNumber} · ${item.customer.fullName} · ${PAYMENT_TYPE_LABELS[item.paymentType]}`
      }
      value={value}
      onValueChange={onValueChange}
      placeholder="ຄົ້ນຫາເລກທີຄຳສັ່ງ..."
      className={className}
      clearable
    />
  );
}
