import type { PermissionId } from "@/server/shared/contracts/permissions";
import { usePermissions } from "../model/usePermissions";

type PermissionGateProps = {
  all?: PermissionId[];
  any?: PermissionId[];
  not?: PermissionId[];
  children?: React.ReactNode;
  fallback?: React.ReactNode;
};

export function PermissionGate({
  all,
  any,
  not,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasAll, hasAny, permissions } = usePermissions();

  const allowAll = all ? hasAll(all) : true;
  const allowAny = any ? hasAny(any) : true;
  const disallow = not ? not.some((p) => permissions.includes(p)) : false;

  if (allowAll && allowAny && !disallow) return <>{children}</>;
  return <>{fallback}</>;
}
