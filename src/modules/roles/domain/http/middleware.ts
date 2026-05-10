import type { PermissionId } from "./contracts/permissions";

type GuardCtx = {
  user: unknown;
  permissions: string[];
  status: (code: number, body?: unknown) => unknown;
};

export function requireAuth({ user, status }: GuardCtx) {
  if (!user) return status(401, { error: "Unauthorized" });
}

export function requirePermission(permId: PermissionId) {
  return ({ permissions, status }: GuardCtx) => {
    if (!permissions?.includes(permId))
      return status(403, { error: "Forbidden" });
  };
}
