export const REPORT_PERIOD_OPTIONS = [
  { value: "day", label: "ມື້ນີ້" },
  { value: "week", label: "7 ວັນລ່າສຸດ" },
  { value: "month", label: "ເດືອນນີ້" },
  { value: "custom", label: "ກຳນົດເອງ" },
] as const;

export type ReportPeriodValue =
  (typeof REPORT_PERIOD_OPTIONS)[number]["value"];

export const REPORT_HUB_CARDS = [
  {
    key: "sales",
    title: "ລາຍງານການຂາຍ",
    description: "ສະຫຼຸບຄຳສັ່ງຂາຍ ແຍກສະກຸນເງິນ ແລະ ປະເພດຊຳລະ",
    href: "/app/reports/sales",
    available: true,
  },
  {
    key: "inventory",
    title: "ລາຍງານສຕັອກ",
    description: "ສະຖານະລົດ ICE/EV ແລະ ມູນຄ່າສຕັອກ",
    href: "/app/reports/inventory",
    available: true,
  },
  {
    key: "payments",
    title: "ລາຍງານການເງິນ",
    description: "ຍອດຮັບ verified ແຍກບັນຊີ ແລະ pending",
    href: "/app/reports/payments",
    available: true,
  },
  {
    key: "after-sales",
    title: "ລາຍງານຫຼັງຂາຍ",
    description: "ປະກັນໃກ້ໝົດອາຍຸ ແລະ ບໍລິການ check-in",
    href: "/app/reports/after-sales",
    available: true,
  },
] as const;
