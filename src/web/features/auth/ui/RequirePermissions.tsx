import type { PermissionId } from "@/server/shared/contracts/permissions";
import { Link } from "@tanstack/react-router";
import { useAuthState } from "../model/useAuthState";
import { usePermissions } from "../model/usePermissions";

type RequirePermissionsProps = {
  all?: PermissionId[];
  any?: PermissionId[];
  redirectTo?: string;
  children?: React.ReactNode;
};

export function RequirePermissions({
  all,
  any,
  redirectTo = "/errors/forbidden",
  children,
}: RequirePermissionsProps) {
  const { isLoading, isAuthenticated } = useAuthState();
  const { hasAll, hasAny } = usePermissions();

  if (isLoading) return null;
  if (!isAuthenticated) return null;

  const allowAll = all ? hasAll(all) : true;
  const allowAny = any ? hasAny(any) : true;

  if (allowAll && allowAny) return <>{children}</>;
  return <Link to={redirectTo} />;
}
