export const Permissions = {
  users: {
    create: "users:create",
    read: "users:read",
    update: "users:update",
    delete: "users:delete",
    ban: "users:ban",
  },
  audit: {
    read: "audit:read",
  },
  inventory: {
    create: "inventory:create",
    read: "inventory:read",
    update: "inventory:update",
    delete: "inventory:delete",
    updateStatus: "inventory:update-status",
  },
  masterData: {
    create: "master-data:create",
    read: "master-data:read",
    update: "master-data:update",
    delete: "master-data:delete",
  },
  sales: {
    create: "sales:create",
    read: "sales:read",
    update: "sales:update",
    cancel: "sales:cancel",
    confirm: "sales:confirm",
  },
} as const;

export const ALL_PERMISSIONS = Object.entries(Permissions).flatMap(
  ([resource, actions]) =>
    Object.entries(actions).map(([action, id]) => ({ id, resource, action })),
);

export type PermissionId = (typeof ALL_PERMISSIONS)[number]["id"];

// Human-friendly labels for rendering in UI
export const RESOURCE_LABELS: Record<string, string> = {
  users: "ຜູ້ໃຊ້",
  audit: "ບັນທຶກການກວດກາ",
  inventory: "ສິນຄ້າຄົງຄັງ",
  masterData: "ຂໍ້ມູນຫຼັກ",
  sales: "ການຂາຍ",
};

export const ACTION_LABELS: Record<string, string> = {
  create: "ສ້າງ",
  read: "ເບິ່ງ",
  update: "ແກ້ໄຂ",
  delete: "ລຶບ",
  ban: "ລະງັບ",
  "update-status": "ປ່ຽນສະຖານະ",
  cancel: "ຍົກເລີກ",
  confirm: "ຢືນຢັນ",
  all: "ທັງໝົດ",
};

export function getResourceLabel(resource: string): string {
  return RESOURCE_LABELS[resource] ?? resource;
}

export function getActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function getPermissionLabel(id: PermissionId): string {
  const [resource, action] = (id as string).split(":");
  return `${getActionLabel(action ?? "")} ${getResourceLabel(resource ?? "")}`;
}

export function getPermissionLabels(ids: PermissionId[]): string[] {
  return ids.map((id) => getPermissionLabel(id));
}
