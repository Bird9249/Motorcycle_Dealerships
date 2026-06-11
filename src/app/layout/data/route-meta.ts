import type { LinkProps } from "@tanstack/react-router";

export type RouteMeta = {
  /** Display label shown in the breadcrumb trail. */
  label: string;
  /** Parent route id used to build the breadcrumb chain. */
  parent?: string;
};

/**
 * Maps a TanStack route id (the `path` pattern) to breadcrumb metadata.
 * `parent` references another concrete route id so we can build a trail even
 * for routes that are not physically nested (e.g. `/app/users/$id/edit`).
 */
export const routeMeta: Record<string, RouteMeta> = {
  "/app/dashboard": { label: "ແຜງຄວບຄຸມ" },
  "/app/roles": { label: "ບົດບາດ" },
  "/app/roles/create": { label: "ສ້າງບົດບາດ", parent: "/app/roles" },
  "/app/roles/$id/edit": { label: "ແກ້ໄຂບົດບາດ", parent: "/app/roles" },
  "/app/users": { label: "ຜູ້ໃຊ້" },
  "/app/users/create": { label: "ສ້າງຜູ້ໃຊ້", parent: "/app/users" },
  "/app/users/$id/edit": { label: "ແກ້ໄຂຜູ້ໃຊ້", parent: "/app/users" },
  "/app/audit": { label: "ບັນທຶກການກວດກາ" },
  "/app/audit/$id": { label: "ລາຍລະອຽດການກວດກາ", parent: "/app/audit" },
  "/app/profile": { label: "ໂປຣໄຟລ໌" },
  "/app/settings": { label: "ການຕັ້ງຄ່າ" },
};

export const HOME_ROUTE = "/app/dashboard" satisfies LinkProps["to"];
