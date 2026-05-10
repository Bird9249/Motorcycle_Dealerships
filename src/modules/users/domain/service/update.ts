import { deleteUserImage } from "@/server/utils/delete-user-image";
import type { UpdateUserDTO } from "../contracts";
import { getUserById } from "../repo/get-by-id";
import { updateUser as updateUserDb } from "../repo/update";
import type { DbTransaction } from "@/shared/types";

export async function updateUserService(
  client: DbTransaction,
  params: { id: string; input: UpdateUserDTO },
) {
  const { id, input } = params;
  const existing = await getUserById(id, client);
  if (!existing) throw new Error("User not found");

  const nextImage =
    input.image !== undefined
      ? input.image === null || input.image === ""
        ? null
        : input.image.trim() || null
      : existing.image;

  const imageChanged =
    nextImage !== (existing.image ?? undefined) ||
    (input.image !== undefined && (input.image === null || input.image === ""));
  const oldImageToDelete =
    imageChanged && existing.image ? existing.image : null;

  const next: UpdateUserDTO = { ...input, image: nextImage };
  const updated = await updateUserDb(id, next, client);
  if (!updated) throw new Error("Failed to update user");
  if (oldImageToDelete) {
    await deleteUserImage(oldImageToDelete);
  }
  return { updated, before: existing };
}
