import { Bike } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/kit";

type TeamSwitcherProps = {
  teams: {
    name: string;
    logo: React.ElementType;
    plan: string;
  }[];
};

export function TeamSwitcher({ teams }: TeamSwitcherProps) {
  const activeTeam = teams[0] ?? {
    name: "ຮ້ານຈຳໜ່າຍມໍເຕີ",
    logo: Bike,
    plan: "Motorcycle ERP",
  };
  const Logo = activeTeam.logo;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="cursor-default hover:bg-transparent active:bg-transparent"
          asChild
        >
          <div className="flex w-full items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Logo className="size-4" />
            </div>
            <div className="grid flex-1 text-start text-sm leading-tight">
              <span className="truncate font-semibold">{activeTeam.name}</span>
              <span className="truncate text-muted-foreground text-xs">
                {activeTeam.plan}
              </span>
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
