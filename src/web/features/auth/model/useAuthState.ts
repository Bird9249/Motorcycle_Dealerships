import type { PermissionId } from "@/server/shared/contracts/permissions";
import { authClient } from "../api/client";

export type AuthUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type Nullable<T> = T | null;

export function useAuthState() {
  const { data, isPending, error, refetch } = authClient.useSession();

  const session = (data ?? null) as Nullable<typeof data>;
  const user = (data?.user ?? null) as Nullable<AuthUser>;
  const isAuthenticated = Boolean(user) && !isPending;
  const permissions = (data?.permissions ?? []) as PermissionId[];

  const hasPermission = (permission: PermissionId): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (required: PermissionId[]): boolean => {
    if (!required?.length) return true;
    return required.some((p) => permissions.includes(p));
  };

  const hasAllPermissions = (required: PermissionId[]): boolean => {
    if (!required?.length) return true;
    return required.every((p) => permissions.includes(p));
  };

  const signOut = async (): Promise<void> => {
    await authClient.signOut();
  };

  return {
    session,
    user,
    isAuthenticated,
    isLoading: isPending,
    error,
    signOut,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refetch,
  };
}

export type UseAuthStateReturn = ReturnType<typeof useAuthState>;
