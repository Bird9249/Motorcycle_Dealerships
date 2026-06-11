/**
 * Placeholder data for the dashboard UI. Replace with real API data once the
 * hotel/booking modules expose endpoints.
 */

export type Stat = {
  key: string;
  label: string;
  value: string;
  delta: number; // percentage change vs previous period
  hint: string;
};

export const stats: Stat[] = [
  {
    key: "bookings",
    label: "ການຈອງມື້ນີ້",
    value: "32",
    delta: 12.5,
    hint: "ທຽບກັບມື້ວານ",
  },
  {
    key: "revenue",
    label: "ລາຍຮັບເດືອນນີ້",
    value: "₭ 248.5M",
    delta: 8.2,
    hint: "ທຽບກັບເດືອນກ່ອນ",
  },
  {
    key: "occupancy",
    label: "ອັດຕາການເຂົ້າພັກ",
    value: "78%",
    delta: -3.1,
    hint: "ທຽບກັບອາທິດກ່ອນ",
  },
  {
    key: "guests",
    label: "ແຂກກຳລັງເຂົ້າພັກ",
    value: "146",
    delta: 5.4,
    hint: "ທຽບກັບມື້ວານ",
  },
];

export type RevenuePoint = {
  month: string;
  revenue: number;
  bookings: number;
};

export const revenueData: RevenuePoint[] = [
  { month: "ມ.ກ", revenue: 182, bookings: 540 },
  { month: "ກ.ພ", revenue: 201, bookings: 610 },
  { month: "ມີ.ນ", revenue: 234, bookings: 700 },
  { month: "ມ.ສ", revenue: 218, bookings: 660 },
  { month: "ພ.ພ", revenue: 256, bookings: 760 },
  { month: "ມິ.ຖ", revenue: 248, bookings: 730 },
];

export type OccupancyPoint = {
  day: string;
  occupied: number;
  available: number;
};

export const occupancyData: OccupancyPoint[] = [
  { day: "ຈ", occupied: 62, available: 38 },
  { day: "ອ", occupied: 70, available: 30 },
  { day: "ພ", occupied: 75, available: 25 },
  { day: "ພຫ", occupied: 81, available: 19 },
  { day: "ສ", occupied: 92, available: 8 },
  { day: "ສ", occupied: 95, available: 5 },
  { day: "ອາ", occupied: 84, available: 16 },
];

export type BookingStatus =
  | "confirmed"
  | "pending"
  | "checked_in"
  | "cancelled";

export type RecentBooking = {
  id: string;
  guest: string;
  room: string;
  status: BookingStatus;
  checkIn: string;
  amount: string;
};

export const recentBookings: RecentBooking[] = [
  {
    id: "BK-1042",
    guest: "ສົມໃຈ ວົງສະຫວັນ",
    room: "Deluxe 301",
    status: "checked_in",
    checkIn: "11 ມິ.ຖ 2026",
    amount: "₭ 1.2M",
  },
  {
    id: "BK-1041",
    guest: "Anna Müller",
    room: "Suite 502",
    status: "confirmed",
    checkIn: "12 ມິ.ຖ 2026",
    amount: "₭ 3.4M",
  },
  {
    id: "BK-1040",
    guest: "ບຸນມີ ໄຊຍະວົງ",
    room: "Standard 110",
    status: "pending",
    checkIn: "12 ມິ.ຖ 2026",
    amount: "₭ 780K",
  },
  {
    id: "BK-1039",
    guest: "John Carter",
    room: "Deluxe 305",
    status: "cancelled",
    checkIn: "10 ມິ.ຖ 2026",
    amount: "₭ 1.1M",
  },
  {
    id: "BK-1038",
    guest: "ນາງ ດາວວົງ",
    room: "Suite 501",
    status: "checked_in",
    checkIn: "10 ມິ.ຖ 2026",
    amount: "₭ 3.2M",
  },
];

export const bookingStatusMeta: Record<
  BookingStatus,
  {
    label: string;
    variant: "default" | "secondary" | "success" | "destructive";
  }
> = {
  confirmed: { label: "ຢືນຢັນແລ້ວ", variant: "default" },
  pending: { label: "ລໍຖ້າ", variant: "secondary" },
  checked_in: { label: "ເຂົ້າພັກແລ້ວ", variant: "success" },
  cancelled: { label: "ຍົກເລີກ", variant: "destructive" },
};
