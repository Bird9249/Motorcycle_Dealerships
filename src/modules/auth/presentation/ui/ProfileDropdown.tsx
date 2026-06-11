import { useNavigate } from "@tanstack/react-router";
import { LogOut, Settings, UserRound } from "lucide-react";
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
} from "@/components/kit";
import { useDisclosure } from "@/shared/hooks/useDisclosure";
import { getInitials } from "@/shared/lib/utils";
import { resolveImageSrc } from "@/shared/ui/AppImage";
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
                src={resolveImageSrc(user?.image) ?? ""}
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
          <DropdownMenuItem onClick={() => navigate({ to: "/app/settings" })}>
            <Settings />
            ການຕັ້ງຄ່າ
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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
