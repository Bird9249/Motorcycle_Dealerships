import { ALL_PERMISSIONS, type PermissionId } from "./permissions";

/** พนักงานขาย — บันทึกการชำระได้ แต่ยืนยัน/ปฏิเสธสลิปไม่ได้ */
const staffPermissions = [
  "inventory:read",
  "master-data:read",
  "sales:create",
  "sales:read",
  "sales:update",
  "sales:confirm",
  "payments:create",
  "payments:read",
] satisfies PermissionId[];

/** หัวหน้า/เจ้าของ — ยืนยัน/ปฏิเสธสลิป + reconcile */
const managerPermissions = [
  ...staffPermissions,
  "payments:verify",
  "payments:reject",
  "payments:reconcile",
  "payments:update",
  "sales:cancel",
  "audit:read",
] satisfies PermissionId[];

export const Roles: Record<string, PermissionId[]> = {
  admin: ALL_PERMISSIONS.map((p) => p.id),
  manager: managerPermissions,
  staff: staffPermissions,
};
