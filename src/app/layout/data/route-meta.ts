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
  "/app/reports": { label: "ລາຍງານ" },
  "/app/reports/sales": { label: "ລາຍງານການຂາຍ", parent: "/app/reports" },
  "/app/reports/inventory": { label: "ລາຍງານສຕັອກ", parent: "/app/reports" },
  "/app/reports/payments": { label: "ລາຍງານການເງິນ", parent: "/app/reports" },
  "/app/reports/after-sales": {
    label: "ລາຍງານຫຼັງຂາຍ",
    parent: "/app/reports",
  },
  "/app/roles": { label: "ບົດບາດ" },
  "/app/roles/create": { label: "ສ້າງບົດບາດ", parent: "/app/roles" },
  "/app/roles/$id/edit": { label: "ແກ້ໄຂບົດບາດ", parent: "/app/roles" },
  "/app/inventory/vehicles": { label: "ລາຍການລົດ" },
  "/app/inventory/vehicles/new": {
    label: "ເພີ່ມລົດ",
    parent: "/app/inventory/vehicles",
  },
  "/app/inventory/vehicles/$id": {
    label: "ລາຍລະອຽດລົດ",
    parent: "/app/inventory/vehicles",
  },
  "/app/inventory/vehicles/$id/edit": {
    label: "ແກ້ໄຂລົດ",
    parent: "/app/inventory/vehicles",
  },
  "/app/master-data": { label: "ຂໍ້ມູນຫຼັກ" },
  "/app/sales": { label: "ການຂາຍ" },
  "/app/sales/new": { label: "ສ້າງການຂາຍ", parent: "/app/sales" },
  "/app/sales/$id": {
    label: "ລາຍລະອຽດການຂາຍ",
    parent: "/app/sales",
  },
  "/app/sales/$id/schedule": {
    label: "ຕາຕະລາງຜ່ອນ",
    parent: "/app/sales/$id",
  },
  "/app/sales/$id/edit": {
    label: "ແກ້ໄຂຄຳສັ່ງຂາຍ",
    parent: "/app/sales/$id",
  },
  "/app/sales/customers": {
    label: "ລູກຄ້າ",
    parent: "/app/sales",
  },
  "/app/customers": { label: "ລູກຄ້າ" },
  "/app/customers/$id": {
    label: "ລາຍລະອຽດລູກຄ້າ",
    parent: "/app/customers",
  },
  "/app/payments": { label: "ການຊຳລະເງິນ" },
  "/app/payments/new": {
    label: "ຮັບຊຳລະ",
    parent: "/app/payments",
  },
  "/app/payments/reconciliation": {
    label: "ກວດສອບຍອດ",
    parent: "/app/payments",
  },
  "/app/payments/$id": {
    label: "ລາຍລະອຽດການຊຳລະ",
    parent: "/app/payments",
  },
  "/app/users": { label: "ຜູ້ໃຊ້" },
  "/app/users/create": { label: "ສ້າງຜູ້ໃຊ້", parent: "/app/users" },
  "/app/users/$id/edit": { label: "ແກ້ໄຂຜູ້ໃຊ້", parent: "/app/users" },
  "/app/audit": { label: "ບັນທຶກການກວດກາ" },
  "/app/audit/$id": { label: "ລາຍລະອຽດການກວດກາ", parent: "/app/audit" },
  "/app/profile": { label: "ໂປຣໄຟລ໌" },
  "/app/settings": { label: "ການຕັ້ງຄ່າ" },
  "/app/after-sales/warranties": { label: "ປະກັນ" },
  "/app/after-sales/warranties/$id": {
    label: "ລາຍລະອຽດປະກັນ",
    parent: "/app/after-sales/warranties",
  },
  "/app/after-sales/service": { label: "ເຂົ້າບໍລິການ" },
};

export const HOME_ROUTE = "/app/dashboard" satisfies LinkProps["to"];
