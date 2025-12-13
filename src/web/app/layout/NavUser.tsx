import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  ConfirmModal,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@devhop/ui";
import { useNavigate } from "@tanstack/react-router";
import { ChevronsUpDown, LogOut, UserRound } from "lucide-react";
import { useAuthState } from "../../features/auth/model/useAuthState";
import { useDisclosure } from "../../shared/hooks/useDisclosure";
import { config } from "../../shared/lib/config";
import { getInitials } from "../../shared/lib/utils";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user, signOut } = useAuthState();
  const { isOpen, open, toggle } = useDisclosure();
  const navigate = useNavigate({ from: "/app" });

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={user?.image ? `${config.apiUrl}${user.image}` : ""}
                    alt={user?.name ?? ""}
                  />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user?.name ?? "")}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user?.name ?? ""}
                  </span>
                  <span className="truncate text-xs">{user?.email ?? ""}</span>
                </div>
                <ChevronsUpDown className="ms-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user?.image ? `${config.apiUrl}${user.image}` : ""}
                      alt={user?.name ?? ""}
                    />
                    <AvatarFallback className="rounded-lg">
                      {getInitials(user?.name ?? "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-start text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.name ?? ""}
                    </span>
                    <span className="truncate text-xs">
                      {user?.email ?? ""}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate({ to: "/app/profile" })}
              >
                <UserRound />
                ໂປຣໄຟລ໌
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => open()}>
                <LogOut />
                ອອກຈາກລະບົບ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <ConfirmModal
        open={!!isOpen}
        onOpenChange={() => {
          toggle();
        }}
        title="ອອກຈາກລະບົບ"
        description="ທ່ານແນ່ໃຈບໍ່ວ່າຈະອອກຈາກລະບົບ? ຈະຕ້ອງເຂົ້າລະບົບໃໝ່ເພື່ອເຂົ້າໃຊ້ບັນຊີ."
        confirmLabel="ອອກຈາກລະບົບ"
        cancelLabel="ຍົກເລີກ"
        confirmVariant="destructive"
        onConfirm={() => {
          signOut();
          navigate({ to: "/auth/login" });
        }}
      />
    </>
  );
}
