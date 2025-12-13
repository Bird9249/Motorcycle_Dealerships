import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  LayoutDashboard,
  ShieldCheck,
  UserCog,
  Users,
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
