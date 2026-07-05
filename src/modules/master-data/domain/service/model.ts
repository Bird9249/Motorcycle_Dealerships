import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import type { CreateModelDTO, UpdateModelDTO } from "../contracts/models";
import {
  mergeModelFieldsForUpdate,
  normalizeModelFields,
} from "../lib/validate-model";
import { getBrandById } from "../repo/brands";
import {
  findModelByBrandAndName,
  getModelById,
  insertModel,
  updateModelById,
} from "../repo/models";

async function assertBrandExists(client: DbTransaction, brandId: string) {
  const brand = await getBrandById(brandId, client);
  if (!brand) {
    throw new AppError("NOT_FOUND", "Brand not found");
  }
  return brand;
}

async function assertUniqueModelName(
  client: DbTransaction,
  params: { brandId: string; name: string; excludeId?: string },
) {
  const conflict = await findModelByBrandAndName(client, params);
  if (conflict) {
    throw new AppError("CONFLICT", "Model name already exists for this brand");
  }
}

export async function createModelService(
  client: DbTransaction,
  params: { input: CreateModelDTO },
) {
  await assertBrandExists(client, params.input.brandId);
  await assertUniqueModelName(client, {
    brandId: params.input.brandId,
    name: params.input.name.trim(),
  });

  const fields = normalizeModelFields(params.input);
  const now = nowDate();

  const created = await insertModel(
    {
      brandId: params.input.brandId,
      name: params.input.name.trim(),
      vehicleType: params.input.vehicleType,
      engineCc: fields.engineCc,
      batteryCapacityKwh: fields.batteryCapacityKwh,
      year: params.input.year ?? null,
      isActive: params.input.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    },
    client,
  );

  if (!created) {
    throw new AppError("CREATE_FAILED", "Failed to create model");
  }

  return { created };
}

export async function updateModelService(
  client: DbTransaction,
  params: { id: string; input: UpdateModelDTO },
) {
  const existing = await getModelById(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Model not found");
  }

  const name = params.input.name?.trim() ?? existing.name;
  if (name !== existing.name) {
    await assertUniqueModelName(client, {
      brandId: existing.brandId,
      name,
      excludeId: params.id,
    });
  }

  const { fields } = mergeModelFieldsForUpdate(existing, params.input);

  const updated = await updateModelById(
    params.id,
    {
      name,
      vehicleType: params.input.vehicleType ?? existing.vehicleType,
      engineCc: fields.engineCc,
      batteryCapacityKwh: fields.batteryCapacityKwh,
      year:
        params.input.year !== undefined ? params.input.year : existing.year,
      isActive: params.input.isActive ?? existing.isActive,
      updatedAt: nowDate(),
    },
    client,
  );

  if (!updated) {
    throw new AppError("NOT_FOUND", "Model not found");
  }

  return { before: existing, updated };
}

export async function updateModelStatusService(
  client: DbTransaction,
  params: { id: string; isActive: boolean },
) {
  const existing = await getModelById(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Model not found");
  }

  if (existing.isActive === params.isActive) {
    return { before: existing, updated: existing };
  }

  const updated = await updateModelById(
    params.id,
    { isActive: params.isActive, updatedAt: nowDate() },
    client,
  );

  if (!updated) {
    throw new AppError("NOT_FOUND", "Model not found");
  }

  return { before: existing, updated };
}
