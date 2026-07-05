import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import type { UpdateCustomerDTO } from "../contracts";
import { getCustomerRecordById, updateCustomerById } from "../repo/customers";

export async function updateCustomerService(
  client: DbTransaction,
  params: { id: string; input: UpdateCustomerDTO },
) {
  const existing = await getCustomerRecordById(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Customer not found");
  }

  const updated = await updateCustomerById(
    params.id,
    {
      fullName: params.input.fullName?.trim() ?? existing.fullName,
      phone: params.input.phone?.trim() ?? existing.phone,
      phoneSecondary:
        params.input.phoneSecondary !== undefined
          ? params.input.phoneSecondary?.trim() ?? null
          : existing.phoneSecondary,
      village:
        params.input.village !== undefined
          ? params.input.village?.trim() ?? null
          : existing.village,
      district:
        params.input.district !== undefined
          ? params.input.district?.trim() ?? null
          : existing.district,
      province:
        params.input.province !== undefined
          ? params.input.province?.trim() ?? null
          : existing.province,
      idCardNumber:
        params.input.idCardNumber !== undefined
          ? params.input.idCardNumber?.trim() ?? null
          : existing.idCardNumber,
      householdBookNumber:
        params.input.householdBookNumber !== undefined
          ? params.input.householdBookNumber?.trim() ?? null
          : existing.householdBookNumber,
      notes:
        params.input.notes !== undefined
          ? params.input.notes?.trim() ?? null
          : existing.notes,
      updatedAt: nowDate(),
    },
    client,
  );

  if (!updated) {
    throw new AppError("NOT_FOUND", "Customer not found");
  }

  return { before: existing, updated };
}
