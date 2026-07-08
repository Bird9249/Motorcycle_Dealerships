import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import type {
  CreatePaymentAccountDTO,
  UpdatePaymentAccountDTO,
} from "../contracts";
import {
  getMaxDisplayOrder,
  getPaymentAccountById,
  insertPaymentAccount,
  updatePaymentAccountById,
} from "../repo/payment-accounts";

function normalizeBankFields(input: {
  type: "cash" | "bank_transfer";
  bankName?: string | null;
  accountNumber?: string | null;
}) {
  if (input.type === "cash") {
    return { bankName: null, accountNumber: null };
  }
  return {
    bankName: input.bankName?.trim() ?? null,
    accountNumber: input.accountNumber?.trim() ?? null,
  };
}

export async function createPaymentAccountService(
  client: DbTransaction,
  params: { input: CreatePaymentAccountDTO },
) {
  const now = nowDate();
  const bankFields = normalizeBankFields(params.input);
  const displayOrder =
    params.input.displayOrder ??
    (await getMaxDisplayOrder(client)) + 1;

  const created = await insertPaymentAccount(
    {
      name: params.input.name.trim(),
      type: params.input.type,
      ...bankFields,
      currency: params.input.currency ?? "LAK",
      qrCodeImageKey: params.input.qrCodeImageKey?.trim() || null,
      isActive: params.input.isActive ?? true,
      displayOrder,
      createdAt: now,
      updatedAt: now,
    },
    client,
  );

  if (!created) {
    throw new AppError("CREATE_FAILED", "Failed to create payment account");
  }

  return { created };
}

export async function updatePaymentAccountService(
  client: DbTransaction,
  params: { id: string; input: UpdatePaymentAccountDTO },
) {
  const existing = await getPaymentAccountById(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Payment account not found");
  }

  const type = params.input.type ?? existing.type;
  const bankFields = normalizeBankFields({
    type,
    bankName:
      params.input.bankName !== undefined
        ? params.input.bankName
        : existing.bankName,
    accountNumber:
      params.input.accountNumber !== undefined
        ? params.input.accountNumber
        : existing.accountNumber,
  });

  const updated = await updatePaymentAccountById(
    params.id,
    {
      name: params.input.name?.trim() ?? existing.name,
      type,
      ...bankFields,
      currency: params.input.currency ?? existing.currency,
      qrCodeImageKey:
        params.input.qrCodeImageKey !== undefined
          ? params.input.qrCodeImageKey?.trim() || null
          : existing.qrCodeImageKey,
      isActive: params.input.isActive ?? existing.isActive,
      displayOrder: params.input.displayOrder ?? existing.displayOrder,
      updatedAt: nowDate(),
    },
    client,
  );

  if (!updated) {
    throw new AppError("NOT_FOUND", "Payment account not found");
  }

  return { before: existing, updated };
}

export async function updatePaymentAccountStatusService(
  client: DbTransaction,
  params: { id: string; isActive: boolean },
) {
  const existing = await getPaymentAccountById(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Payment account not found");
  }

  if (existing.isActive === params.isActive) {
    return { before: existing, updated: existing };
  }

  const updated = await updatePaymentAccountById(
    params.id,
    { isActive: params.isActive, updatedAt: nowDate() },
    client,
  );

  if (!updated) {
    throw new AppError("NOT_FOUND", "Payment account not found");
  }

  return { before: existing, updated };
}
