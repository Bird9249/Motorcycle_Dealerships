import { getAuditContext } from "@/server/modules/audit/http/helpers";
import { appendAudit } from "@/server/modules/audit/services/append-audit";
import { bunFileStorage } from "@/server/shared/files/bun-storage";
import { makeService } from "@/server/shared/service";
import { getUserById } from "../repo/get-by-id";
import { updateUser as updateUserDb } from "../repo/update";
import type { UpdateUserDTO } from "../contracts";

export const updateUserService = makeService<
  {
    id: string;
    input: UpdateUserDTO;
    imageFile?: File | null;
  },
  { id: string } | null
>({
  name: "userUpdate",
  run: async (client, { id, input, imageFile }) => {
    const existing = await getUserById(id, client);
    if (!existing) return null;

    let next: UpdateUserDTO = { ...input };
    let oldImageToDelete: string | null = null;

    if (imageFile && imageFile.size > 0) {
      const saved = await bunFileStorage.save(imageFile, "uploads");
      next = { ...next, image: saved.url };
      oldImageToDelete = existing.image ?? null;
    }
    if (input.image === null && existing.image) {
      next = { ...next, image: null };
      oldImageToDelete = existing.image ?? null;
    }

    const updated = await updateUserDb(id, next, client);
    if (updated && oldImageToDelete) {
      await bunFileStorage.deleteByUrl(oldImageToDelete);
    }
    return updated;
  },
  onSuccess: async ({ client, input, output, ctx }) => {
    if (!ctx || !output) return;
    const before = await getUserById(input.id, client);
    await appendAudit(client, [
      {
        occurredAt: new Date().toISOString(),
        action: "USER.UPDATE",
        entityType: "user",
        entityId: input.id,
        result: "success",
        before: before ?? undefined,
        after: output,
        ...getAuditContext(ctx),
      },
    ]);
  },
});
