import { AppError } from "@/shared/errors";
import { nowDate } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import type { CreateBrandDTO, UpdateBrandDTO } from "../contracts/brands";
import { slugify } from "../lib/format";
import {
  findBrandBySlug,
  getBrandById,
  insertBrand,
  updateBrandById,
} from "../repo/brands";

async function assertUniqueSlug(
  client: DbTransaction,
  slug: string,
  excludeId?: string,
) {
  const conflict = await findBrandBySlug(slug, client, excludeId);
  if (conflict) {
    throw new AppError("CONFLICT", "Brand slug already exists");
  }
}

export async function createBrandService(
  client: DbTransaction,
  params: { input: CreateBrandDTO },
) {
  const slug = params.input.slug?.trim() || slugify(params.input.name);
  await assertUniqueSlug(client, slug);

  const now = nowDate();
  const created = await insertBrand(
    {
      name: params.input.name.trim(),
      slug,
      isActive: params.input.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    },
    client,
  );

  if (!created) {
    throw new AppError("CREATE_FAILED", "Failed to create brand");
  }

  return { created };
}

export async function updateBrandService(
  client: DbTransaction,
  params: { id: string; input: UpdateBrandDTO },
) {
  const existing = await getBrandById(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Brand not found");
  }

  const slug =
    params.input.slug?.trim() ||
    (params.input.name ? slugify(params.input.name) : undefined) ||
    existing.slug;

  if (slug !== existing.slug) {
    await assertUniqueSlug(client, slug, params.id);
  }

  const updated = await updateBrandById(
    params.id,
    {
      name: params.input.name?.trim() ?? existing.name,
      slug,
      isActive: params.input.isActive ?? existing.isActive,
      updatedAt: nowDate(),
    },
    client,
  );

  if (!updated) {
    throw new AppError("NOT_FOUND", "Brand not found");
  }

  return { before: existing, updated };
}

export async function updateBrandStatusService(
  client: DbTransaction,
  params: { id: string; isActive: boolean },
) {
  const existing = await getBrandById(params.id, client);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Brand not found");
  }

  if (existing.isActive === params.isActive) {
    return { before: existing, updated: existing };
  }

  const updated = await updateBrandById(
    params.id,
    { isActive: params.isActive, updatedAt: nowDate() },
    client,
  );

  if (!updated) {
    throw new AppError("NOT_FOUND", "Brand not found");
  }

  return { before: existing, updated };
}
