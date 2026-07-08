import type {
  ServiceType,
  WarrantyStatus,
  WarrantyType,
} from "@/modules/after-sales/domain/contracts";

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  oil_change: "ປ່ຽນນ້ຳມັນ",
  battery_check: "ກວດແບດ",
  electrical_check: "ກວດໄຟຟ້າ",
  general: "ບຳລຸງຮັກສາທົ່ວໄປ",
};

export const SERVICE_TYPE_OPTIONS = (
  Object.entries(SERVICE_TYPE_LABELS) as [ServiceType, string][]
).map(([value, label]) => ({ value, label }));

export const WARRANTY_TYPE_LABELS: Record<WarrantyType, string> = {
  vehicle: "ປະກັນຕົວລົດ",
  motor: "ປະກັນມໍເຕີ",
  battery: "ປະກັນແບດ",
};

export const WARRANTY_STATUS_LABELS: Record<WarrantyStatus, string> = {
  active: "ຍັງໃຊ້ໄດ້",
  expired: "ໝົດອາຍຸ",
  claimed: "ເຄມແລ້ວ",
  voided: "ຍົກເວັ້ນ",
};

export const WARRANTY_TYPE_OPTIONS = (
  Object.entries(WARRANTY_TYPE_LABELS) as [WarrantyType, string][]
).map(([value, label]) => ({ value, label }));

export const WARRANTY_STATUS_OPTIONS = (
  Object.entries(WARRANTY_STATUS_LABELS) as [WarrantyStatus, string][]
).map(([value, label]) => ({ value, label }));

export function warrantyExpiryTone(daysRemaining: number): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  if (daysRemaining < 0) {
    return { label: "ໝົດອາຍຸ", variant: "destructive" };
  }
  if (daysRemaining <= 7) {
    return { label: `ເຫຼືອ ${daysRemaining} ວັນ`, variant: "destructive" };
  }
  if (daysRemaining <= 30) {
    return { label: `ເຫຼືອ ${daysRemaining} ວັນ`, variant: "secondary" };
  }
  return { label: `ເຫຼືອ ${daysRemaining} ວັນ`, variant: "outline" };
}
