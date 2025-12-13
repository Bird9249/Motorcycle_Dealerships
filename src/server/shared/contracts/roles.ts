import { ALL_PERMISSIONS, type PermissionId } from "./permissions";

export const Roles: Record<string, PermissionId[]> = {
  admin: ALL_PERMISSIONS.map((p) => p.id),
};
