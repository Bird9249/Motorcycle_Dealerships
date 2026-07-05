import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import type { CreateCustomerDTO } from "../contracts";
import { insertCustomer } from "../repo/customers";

export async function createCustomerService(
  client: DbTransaction,
  params: { input: CreateCustomerDTO; createdBy?: string | null },
) {
  const now = nowDate();
  const created = await insertCustomer(
    {
      fullName: params.input.fullName,
      phone: params.input.phone,
      phoneSecondary: params.input.phoneSecondary ?? null,
      village: params.input.village ?? null,
      district: params.input.district ?? null,
      province: params.input.province ?? null,
      idCardNumber: params.input.idCardNumber ?? null,
      householdBookNumber: params.input.householdBookNumber ?? null,
      notes: params.input.notes ?? null,
      createdBy: params.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    },
    client,
  );

  if (!created) {
    throw new AppError("CREATE_FAILED", "Failed to create customer");
  }

  return { created };
}
