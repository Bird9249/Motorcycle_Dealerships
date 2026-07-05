export type VehicleStatus =
  | "in_stock"
  | "reserved"
  | "sold"
  | "in_service"
  | "written_off";

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  in_stock: "ຄົງຄັງ",
  reserved: "ຈອງແລ້ວ",
  sold: "ຂາຍແລ້ວ",
  in_service: "ກຳລັງສ້ອມ",
  written_off: "ຍົກເລີກ",
};

export const VEHICLE_TYPE_LABELS = {
  ice: "ນ້ຳມັນ",
  ev: "ໄຟຟ້າ",
} as const;

export const CURRENCY_OPTIONS = [
  { value: "LAK", label: "LAK (₭)" },
  { value: "THB", label: "THB (฿)" },
  { value: "USD", label: "USD ($)" },
] as const;

export const VEHICLE_STATUS_OPTIONS = (
  Object.entries(VEHICLE_STATUS_LABELS) as [VehicleStatus, string][]
).map(([value, label]) => ({ value, label }));

export const VEHICLE_TYPE_OPTIONS = [
  { value: "all", label: "ທັງໝົດ" },
  { value: "ice", label: VEHICLE_TYPE_LABELS.ice },
  { value: "ev", label: VEHICLE_TYPE_LABELS.ev },
];

export const DOCUMENT_TYPE_LABELS = {
  import_invoice: "ໃບເສຍພາສີ",
  technical_inspection: "ໃບກວດກາເຕັກນິກ",
  other: "ເອກະສານອື່ນໆ",
} as const;

export type VehicleDocumentType = keyof typeof DOCUMENT_TYPE_LABELS;

export const DOCUMENT_TYPE_OPTIONS = (
  Object.entries(DOCUMENT_TYPE_LABELS) as [VehicleDocumentType, string][]
).map(([value, label]) => ({ value, label }));

export const REGISTRATION_READY_OPTIONS = [
  { value: "all", label: "ທຸກເອກະສານ" },
  { value: "ready", label: "ພ້ອມທະບຽນ" },
  { value: "not_ready", label: "ຍັງບໍ່ຄົບ" },
] as const;

export type RegistrationReadyFilter =
  (typeof REGISTRATION_READY_OPTIONS)[number]["value"];
