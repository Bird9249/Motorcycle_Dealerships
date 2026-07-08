import { AppError } from "@/shared/errors";
import type { DbTransaction } from "@/shared/types";
import {
  deleteCustomerById,
  getCustomerRecordById,
} from "../repo/customers";
import { countSalesOrdersByCustomerId } from "../repo/sales-orders";

export async function deleteCustomerService(
  client: DbTransaction,
  params: { id: string },
) {
  const existing = await getCustomerRecordById(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Customer not found");
  }

  const orderCount = await countSalesOrdersByCustomerId(params.id, client);
  if (orderCount > 0) {
    throw new AppError(
      "CUSTOMER_HAS_SALES",
      "Cannot delete customer with existing sales orders",
    );
  }

  const deleted = await deleteCustomerById(params.id, client);
  if (!deleted) {
    throw new AppError("DELETE_FAILED", "Failed to delete customer");
  }

  return { before: existing, deleted };
}
