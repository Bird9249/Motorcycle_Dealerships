import { AppError } from "@/shared/errors";
import type { DbTransaction } from "@/shared/types";
import { getCustomerRecordById } from "../repo/customers";
import { listSalesOrders } from "../repo/sales-orders";

export async function getCustomerDetailService(
  client: DbTransaction,
  params: { id: string },
) {
  const customer = await getCustomerRecordById(params.id, client);
  if (!customer) {
    throw new AppError("NOT_FOUND", "Customer not found");
  }

  const orders = await listSalesOrders(
    {
      customerId: params.id,
      limit: 100,
      offset: 0,
    },
    client,
  );

  return {
    ...customer,
    salesOrders: orders.data,
    salesOrderCount: orders.meta.total,
  };
}
