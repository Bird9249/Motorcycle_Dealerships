import { useDisclosure } from "@/web/shared/hooks/useDisclosure";
import { config } from "@/web/shared/lib/config";
import { getInitials } from "@/web/shared/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  ConfirmModal,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@devhop/ui";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, UserRound } from "lucide-react";
import { useAuthState } from "../model/useAuthState";

export function ProfileDropdown() {
  const { isOpen, open, toggle } = useDisclosure();
  const { user, signOut } = useAuthState();
  const navigate = useNavigate({ from: "/app" });

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={
                  user?.image ? config.apiUrl + user.image : "/avatars/01.png"
                }
                alt={user?.name ?? "user"}
              />
              <AvatarFallback>
                {getInitials(user?.name ?? "User")}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1.5">
              <p className="font-medium text-sm leading-none">
                {user?.name ?? "ຜູ້ໃຊ້"}
              </p>
              <p className="text-muted-foreground text-xs leading-none">
                {user?.email ?? ""}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate({ to: "/app/profile" })}>
            <UserRound />
            ໂປຣໄຟລ໌
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => open()}>
            <LogOut />
            ອອກຈາກລະບົບ
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmModal
        open={!!isOpen}
        onOpenChange={toggle}
        onConfirm={async () => {
          await signOut();
          navigate({ to: "/auth/login" });
        }}
        confirmLabel="ອອກຈາກລະບົບ"
        cancelLabel="ຍົກເລີກ"
        confirmVariant="destructive"
        title="ອອກຈາກລະບົບ"
        description="ທ່ານແນ່ໃຈບໍ່ວ່າຈະອອກຈາກລະບົບ? ຈະຕ້ອງເຂົ້າລະບົບໃໝ່ເພື່ອເຂົ້າໃຊ້ບັນຊີ."
      />
    </>
  );
}
