export const PAYMENT_STATUS_LABELS = {
  pending: "ລໍຖ້າຢືນຢັນ",
  verified: "ຢືນຢັນແລ້ວ",
  rejected: "ປະຕິເສດ",
} as const;

export const PAYMENT_METHOD_LABELS = {
  cash: "ເງິນສົດ",
  bank_transfer: "ໂອນທະນາຄານ",
} as const;

export const PAYMENT_ACCOUNT_TYPE_LABELS = PAYMENT_METHOD_LABELS;

export type PaymentStatus = keyof typeof PAYMENT_STATUS_LABELS;

export const PAYMENT_STATUS_OPTIONS = (
  Object.entries(PAYMENT_STATUS_LABELS) as [PaymentStatus, string][]
).map(([value, label]) => ({ value, label }));

export const RECONCILIATION_STATUS_LABELS = {
  open: "ຍັງບໍ່ກວດ",
  balanced: "ຍອດກົງ",
  discrepancy: "ຍອດບໍ່ກົງ",
} as const;

export type ReconciliationStatus = keyof typeof RECONCILIATION_STATUS_LABELS;
