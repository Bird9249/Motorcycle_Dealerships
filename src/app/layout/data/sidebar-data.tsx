import {
  Bike,
  Database,
  LayoutDashboard,
  ReceiptIcon,
  Scale,
  ScrollText,
  Settings,
  ShieldCheck,
  UserCog,
  UserRound,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import type { SidebarData } from "../types";

export const sidebarData: SidebarData = {
  teams: [
    {
      name: "ຮ້ານຈຳໜ່າຍມໍເຕີ",
      logo: Bike,
      plan: "Motorcycle ERP · Laos",
    },
  ],
  navGroups: [
    {
      title: "ພາບລວມ",
      items: [
        {
          title: "ແຜງຄວບຄຸມ",
          url: "/app/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "ສຕັອກ",
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
      ],
    },
    {
      title: "ການຂາຍ",
      items: [
        {
          title: "ຄຳສັ່ງຂາຍ",
          url: "/app/sales",
          icon: ReceiptIcon,
          requiredPermissions: ["sales:read"],
        },
        {
          title: "ລູກຄ້າ",
          url: "/app/customers",
          icon: UserRound,
          requiredPermissions: ["customers:read"],
        },
      ],
    },
    {
      title: "ການເງິນ",
      items: [
        {
          title: "ການຊຳລະເງິນ",
          url: "/app/payments",
          icon: Wallet,
          requiredPermissions: ["payments:read"],
        },
        {
          title: "ກວດສອບຍອດ",
          url: "/app/payments/reconciliation",
          icon: Scale,
          requiredPermissions: ["payments:reconcile"],
        },
      ],
    },
    {
      title: "ຫຼັງການຂາຍ",
      items: [
        {
          title: "ປະກັນ",
          url: "/app/after-sales/warranties",
          icon: ShieldCheck,
          requiredPermissions: ["after-sales:read"],
        },
        {
          title: "ເຂົ້າບໍລິການ",
          url: "/app/after-sales/service",
          icon: Wrench,
          requiredPermissions: ["after-sales:read"],
        },
      ],
    },
    {
      title: "ລະບົບ",
      items: [
        {
          title: "ການຕັ້ງຄ່າ",
          url: "/app/settings",
          icon: Settings,
        },
        {
          title: "ຜູ້ໃຊ້",
          url: "/app/users",
          icon: Users,
          requiredPermissions: ["users:read"],
        },
        {
          title: "ບົດບາດ",
          url: "/app/roles",
          icon: UserCog,
          requiredPermissions: ["users:read"],
        },
        {
          title: "ບັນທຶກການກວດກາ",
          url: "/app/audit",
          icon: ScrollText,
          requiredPermissions: ["audit:read"],
        },
      ],
    },
  ],
};
