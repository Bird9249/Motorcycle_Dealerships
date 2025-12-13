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
};

export const ACTION_LABELS: Record<string, string> = {
  create: "ສ້າງ",
  read: "ເບິ່ງ",
  update: "ແກ້ໄຂ",
  delete: "ລຶບ",
  ban: "ລະງັບ",
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
