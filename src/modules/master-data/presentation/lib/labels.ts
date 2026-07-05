import type { ActiveFilter } from "@/modules/master-data/domain/contracts/common";

export const ACTIVE_FILTER_OPTIONS = [
  { value: "all", label: "ທັງໝົດ" },
  { value: "active", label: "ໃຊ້ງານ" },
  { value: "inactive", label: "ປິດໃຊ້" },
] as const satisfies ReadonlyArray<{ value: ActiveFilter; label: string }>;

export const VEHICLE_TYPE_LABELS = {
  ice: "ນ້ຳມັນ (ICE)",
  ev: "ໄຟຟ້າ (EV)",
} as const;

export const VEHICLE_TYPE_FORM_OPTIONS = [
  { value: "ice", label: VEHICLE_TYPE_LABELS.ice },
  { value: "ev", label: VEHICLE_TYPE_LABELS.ev },
] as const;

export const VEHICLE_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "ທຸກປະເພດ" },
  ...VEHICLE_TYPE_FORM_OPTIONS,
] as const;
