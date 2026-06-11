import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  cn,
  Loader,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from "@/components/kit";
import { useAuthState } from "@/modules/auth/presentation/model/useAuthState";
import { getCookie } from "@/shared/lib/cookies";
import { SkipToMain } from "@/shared/ui/SkipToMain";
import { LayoutProvider } from "../providers/LayoutProvider";
import { AppSidebar } from "./AppSidebar";
import { sidebarData } from "./data/sidebar-data";
import { NavGroup } from "./NavGroup";
import { NavUser } from "./NavUser";
import { TeamSwitcher } from "./TeamSwitcher";

type AuthenticatedLayoutProps = {
  children?: React.ReactNode;
};

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie("sidebar_state") !== "false";
  const { isLoading, isAuthenticated } = useAuthState();
  const navigate = useNavigate({ from: "/app" });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/auth/login" });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="container grid h-svh max-w-none items-center justify-center">
        <Loader />
      </div>
    );
  }
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <LayoutProvider>
        <SkipToMain />
        <AppSidebar>
          <SidebarHeader>
            <TeamSwitcher teams={sidebarData.teams} />
          </SidebarHeader>
          <SidebarContent>
            {sidebarData.navGroups.map((props) => (
              <NavGroup key={props.title} {...props} />
            ))}
          </SidebarContent>
          <SidebarFooter>
            <NavUser />
          </SidebarFooter>
          <SidebarRail />
        </AppSidebar>
        <SidebarInset
          className={cn(
            // If layout is fixed, set the height
            // to 100svh to prevent overflow
            "has-[[data-layout=fixed]]:h-svh",

            // If layout is fixed and sidebar is inset,
            // set the height to 100svh - 1rem (total margins) to prevent overflow
            // 'peer-data-[variant=inset]:has-[[data-layout=fixed]]:h-[calc(100svh-1rem)]',
            "peer-data-[variant=inset]:has-[[data-layout=fixed]]:h-[calc(100svh-(var(--spacing)*4))]",

            // Set content container, so we can use container queries
            "@container/content",
          )}
        >
          {children ?? <Outlet />}
        </SidebarInset>
      </LayoutProvider>
    </SidebarProvider>
  );
}
