import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import type { CreateColorDTO, UpdateColorDTO } from "../contracts/colors";
import {
  findColorByName,
  getColorById,
  insertColor,
  updateColorById,
} from "../repo/colors";

async function assertUniqueColorName(
  client: DbTransaction,
  name: string,
  excludeId?: string,
) {
  const conflict = await findColorByName(name, client, excludeId);
  if (conflict) {
    throw new AppError("CONFLICT", "Color name already exists");
  }
}

export async function createColorService(
  client: DbTransaction,
  params: { input: CreateColorDTO },
) {
  const name = params.input.name.trim();
  await assertUniqueColorName(client, name);

  const now = nowDate();
  const created = await insertColor(
    {
      name,
      hexCode: params.input.hexCode?.trim() || null,
      isActive: params.input.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    },
    client,
  );

  if (!created) {
    throw new AppError("CREATE_FAILED", "Failed to create color");
  }

  return { created };
}

export async function updateColorService(
  client: DbTransaction,
  params: { id: string; input: UpdateColorDTO },
) {
  const existing = await getColorById(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Color not found");
  }

  const name = params.input.name?.trim() ?? existing.name;
  if (name !== existing.name) {
    await assertUniqueColorName(client, name, params.id);
  }

  const updated = await updateColorById(
    params.id,
    {
      name,
      hexCode:
        params.input.hexCode !== undefined
          ? params.input.hexCode?.trim() || null
          : existing.hexCode,
      isActive: params.input.isActive ?? existing.isActive,
      updatedAt: nowDate(),
    },
    client,
  );

  if (!updated) {
    throw new AppError("NOT_FOUND", "Color not found");
  }

  return { before: existing, updated };
}

export async function updateColorStatusService(
  client: DbTransaction,
  params: { id: string; isActive: boolean },
) {
  const existing = await getColorById(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Color not found");
  }

  if (existing.isActive === params.isActive) {
    return { before: existing, updated: existing };
  }

  const updated = await updateColorById(
    params.id,
    { isActive: params.isActive, updatedAt: nowDate() },
    client,
  );

  if (!updated) {
    throw new AppError("NOT_FOUND", "Color not found");
  }

  return { before: existing, updated };
}
