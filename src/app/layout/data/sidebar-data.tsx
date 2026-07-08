import {
  AudioWaveform,
  Bike,
  Command,
  Database,
  GalleryVerticalEnd,
  LayoutDashboard,
  ReceiptIcon,
  ShieldCheck,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import type { SidebarData } from "../types";

export const sidebarData: SidebarData = {
  teams: [
    {
      name: "Shadcn Admin",
      logo: Command,
      plan: "Vite + ShadcnUI",
    },
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
  ],
  navGroups: [
    {
      title: "ທົ່ວໄປ",
      items: [
        {
          title: "ແຜງຄວບຄຸມ",
          url: "/app/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "ທຸລະກິດ",
      items: [
        {
          title: "ລາຍການລົດ",
          url: "/app/inventory/vehicles",
          icon: Bike,
          requiredPermissions: ["inventory:read"],
        },
        {
          title: "ຂໍ້ມູນຫຼັກ",
          url: "/app/master-data",
          icon: Database,
          requiredPermissions: ["master-data:read"],
        },
        {
          title: "ການຂາຍ",
          url: "/app/sales",
          icon: ReceiptIcon,
          requiredPermissions: ["sales:read"],
        },
        {
          title: "ການຊຳລະເງິນ",
          url: "/app/payments",
          icon: Wallet,
          requiredPermissions: ["payments:read"],
        },
        {
          title: "ລູກຄ້າ",
          url: "/app/sales/customers",
          icon: Users,
          requiredPermissions: ["sales:read"],
        },
      ],
    },
    {
      title: "ການຄວບຄຸມການເຂົ້າເຖິງ",
      items: [
        {
          title: "ບົດບາດ",
          url: "/app/roles",
          icon: UserCog,
          requiredPermissions: ["users:read"],
        },
        {
          title: "ຜູ້ໃຊ້",
          url: "/app/users",
          icon: Users,
          requiredPermissions: ["users:read"],
        },
        {
          title: "ບັນທຶກການກວດກາ",
          url: "/app/audit",
          icon: ShieldCheck,
          requiredPermissions: ["audit:read"],
        },
      ],
    },
  ],
};
