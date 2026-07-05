import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import type {
  CreateFinanceCompanyDTO,
  UpdateFinanceCompanyDTO,
} from "../contracts";
import {
  findFinanceCompanyByCode,
  getFinanceCompanyRecordById,
  insertFinanceCompany,
  updateFinanceCompanyById,
} from "../repo/finance-companies";

async function assertUniqueCode(
  client: DbTransaction,
  code: string,
  excludeId?: string,
) {
  const conflict = await findFinanceCompanyByCode(code, client, excludeId);
  if (conflict) {
    throw new AppError("CONFLICT", "Finance company code already exists");
  }
}

export async function createFinanceCompanyService(
  client: DbTransaction,
  params: { input: CreateFinanceCompanyDTO },
) {
  const code = params.input.code.trim().toUpperCase();
  await assertUniqueCode(client, code);

  const created = await insertFinanceCompany(
    {
      name: params.input.name.trim(),
      code,
      contactPhone: params.input.contactPhone?.trim() ?? null,
      isActive: params.input.isActive ?? true,
      createdAt: nowDate(),
    },
    client,
  );

  if (!created) {
    throw new AppError("CREATE_FAILED", "Failed to create finance company");
  }

  return { created };
}

export async function updateFinanceCompanyService(
  client: DbTransaction,
  params: { id: string; input: UpdateFinanceCompanyDTO },
) {
  const existing = await getFinanceCompanyRecordById(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Finance company not found");
  }

  const code = params.input.code?.trim().toUpperCase() ?? existing.code;
  if (code !== existing.code) {
    await assertUniqueCode(client, code, params.id);
  }

  const updated = await updateFinanceCompanyById(
    params.id,
    {
      name: params.input.name?.trim() ?? existing.name,
      code,
      contactPhone:
        params.input.contactPhone !== undefined
          ? params.input.contactPhone?.trim() ?? null
          : existing.contactPhone,
      isActive: params.input.isActive ?? existing.isActive,
    },
    client,
  );

  if (!updated) {
    throw new AppError("NOT_FOUND", "Finance company not found");
  }

  return { before: existing, updated };
}

export async function updateFinanceCompanyStatusService(
  client: DbTransaction,
  params: { id: string; isActive: boolean },
) {
  const existing = await getFinanceCompanyRecordById(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Finance company not found");
  }

  if (existing.isActive === params.isActive) {
    return { before: existing, updated: existing };
  }

  const updated = await updateFinanceCompanyById(
    params.id,
    { isActive: params.isActive },
    client,
  );

  if (!updated) {
    throw new AppError("NOT_FOUND", "Finance company not found");
  }

  return { before: existing, updated: updated };
}
