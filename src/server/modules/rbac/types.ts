import type { getRoleById } from "./repo/get-role-by-id";
import type { listRoles } from "./repo/list-roles";
import type { createRoleService } from "./service/create";
import type { deleteRoleService } from "./service/delete";
import type { syncFromCodeService } from "./service/sync";
import type { updateRoleService } from "./service/update";

export type RolesListResult = Awaited<ReturnType<typeof listRoles>>;
export type RoleByIdResult = Awaited<ReturnType<typeof getRoleById>>;

export type CreateRoleServiceResult = Awaited<
  ReturnType<typeof createRoleService>
>;
export type UpdateRoleServiceResult = Awaited<
  ReturnType<typeof updateRoleService>
>;
export type DeleteRoleServiceResult = Awaited<
  ReturnType<typeof deleteRoleService>
>;
export type RbacSyncFromCodeServiceResult = Awaited<
  ReturnType<typeof syncFromCodeService>
>;
