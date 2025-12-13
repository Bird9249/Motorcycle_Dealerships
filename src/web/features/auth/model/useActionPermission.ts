import type { PermissionId } from "@/server/shared/contracts/permissions";
import { usePermissions } from "./usePermissions";

export type UseActionPermissionInput = {
  all?: PermissionId[];
  any?: PermissionId[];
  not?: PermissionId[];
};

export function useActionPermission(
  input: PermissionId | PermissionId[] | UseActionPermissionInput,
  mode: "all" | "any" = "all",
): boolean {
  const { has, hasAll, hasAny, permissions } = usePermissions();

  if (typeof input === "string") {
    return has(input);
  }

  if (Array.isArray(input)) {
    return mode === "all" ? hasAll(input) : hasAny(input);
  }

  const { all, any, not } = input ?? {};
  const allowAll = all ? hasAll(all) : true;
  const allowAny = any ? hasAny(any) : true;
  const disallow = not ? not.some((p) => permissions.includes(p)) : false;
  return allowAll && allowAny && !disallow;
}
