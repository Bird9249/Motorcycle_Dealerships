import { getAuditContext } from "@/server/modules/audit/http/helpers";
import { appendAudit } from "@/server/modules/audit/services/append-audit";
import { createCredentialAccount } from "@/server/modules/auth/repo/create-account";
import { bcryptLikeHasher } from "@/server/modules/auth/services/password.bcrypt";
import { assignRoleToUser } from "@/server/modules/rbac/repo/assign-role-to-user";
import { USER_ROLES } from "@/server/shared/contracts/user-roles";
import { bunFileStorage } from "@/server/shared/files/bun-storage";
import { makeService } from "@/server/shared/service";
import { createUser } from "../repo/create";
import type { CreateUserDTO } from "../contracts";

export const createUserService = makeService<
  { input: CreateUserDTO; imageFile?: File | null },
  { id: string }
>({
  name: "userCreate",
  run: async (client, { input, imageFile }) => {
    let imageUrl = input.image ?? null;
    if (imageFile && imageFile.size > 0) {
      const saved = await bunFileStorage.save(imageFile, "uploads");
      imageUrl = saved.url;
    }
    const now = new Date().toISOString();
    const created = await createUser(
      {
        email: input.email,
        name: input.name ?? undefined,
        image: imageUrl ?? null,
        emailVerified: false,
        banned: false,
        createdAt: now,
        updatedAt: now,
        role: USER_ROLES.staff,
      },
      client,
    );
    if (input.password) {
      const passwordHash = await bcryptLikeHasher.hash(input.password);
      await createCredentialAccount(
        { userId: created.id, passwordHash, now },
        client,
      );
    }
    if (input.roleId) {
      await assignRoleToUser(created.id, input.roleId, client);
    }
    return created;
  },
  onSuccess: async ({ client, input, output, ctx }) => {
    if (!ctx) return;
    await appendAudit(client, [
      {
        occurredAt: new Date().toISOString(),
        action: "USER.CREATE",
        entityType: "user",
        entityId: output.id,
        result: "success",
        after: { ...output, ...input.input },
        ...getAuditContext(ctx),
      },
    ]);
  },
});
