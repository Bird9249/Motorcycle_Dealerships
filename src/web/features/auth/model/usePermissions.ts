import type { PermissionId } from "@/server/shared/contracts/permissions";
import { useAuthState } from "./useAuthState";

export type UsePermissions = {
  permissions: PermissionId[];
  has: (permission: PermissionId) => boolean;
  hasAny: (required: PermissionId[] | undefined) => boolean;
  hasAll: (required: PermissionId[] | undefined) => boolean;
};

export function usePermissions(): UsePermissions {
  const { permissions, hasPermission, hasAnyPermission, hasAllPermissions } =
    useAuthState();

  return {
    permissions,
    has: (permission) => hasPermission(permission),
    hasAny: (required) => hasAnyPermission(required ?? []),
    hasAll: (required) => hasAllPermissions(required ?? []),
  };
}
