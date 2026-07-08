import { Bike, ReceiptIcon, ShieldCheck, Wallet } from "lucide-react";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader, ModeToggle } from "@/components/kit";
import { useAuthState } from "@/modules/auth/presentation/model/useAuthState";

const HIGHLIGHTS = [
  {
    icon: Bike,
    title: "ຕິດຕາມລົດລາຍຄັນ",
    description: "ເລກຖັງ · ເລກຈັກ · ແບດ EV",
  },
  {
    icon: ReceiptIcon,
    title: "ການຂາຍ ແລະ ການຜ່ອນ",
    description: "ສົດ · ໄຟແອນ · ຜ່ອນຮ້ານ",
  },
  {
    icon: Wallet,
    title: "ຮັບຊຳລະ ແລະ ກວດສອບຍອດ",
    description: "ສລິບໂອນ · ແຍກບັນຊີ",
  },
  {
    icon: ShieldCheck,
    title: "ປະກັນ ແລະ ບໍລິການ",
    description: "ຕິດຕາມປະກັນ · check-in",
  },
] as const;

function AuthBrandPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "space-y-3" : "space-y-8"}>
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
          <Bike className="size-5" />
        </div>
        <div>
          <p className="font-semibold text-lg leading-tight tracking-tight">
            ຮ້ານຈຳໜ່າຍມໍເຕີ
          </p>
          <p className="text-muted-foreground text-sm">Motorcycle ERP · Laos</p>
        </div>
      </div>

      {!compact ? (
        <>
          <p className="max-w-md text-muted-foreground text-sm leading-relaxed">
            ລະບົບຈັດການຮ້ານຈຳໜ່າຍມໍເຕີໄຊຍານ — ສຕັອກ ການຂາຍ ການເງິນ
            ແລະ ບໍລິການຫຼັງການຂາຍ ໃນຈຸດດຽວ
          </p>

          <ul className="grid gap-3 sm:grid-cols-2">
            {HIGHLIGHTS.map((item) => (
              <li
                key={item.title}
                className="flex gap-3 rounded-lg border bg-card/60 p-3 backdrop-blur-sm"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <item.icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          ລະບົບຈັດການຮ້ານຈຳໜ່າຍມໍເຕີໄຊຍານ
        </p>
      )}
    </div>
  );
}

export function AuthLayout() {
  const { isLoading, isAuthenticated } = useAuthState();
  const navigate = useNavigate({ from: "/auth" });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: "/app/dashboard" });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  return (
    <div className="relative min-h-svh bg-background">
      <div className="absolute top-4 right-4 z-10">
        <ModeToggle />
      </div>

      <div className="grid min-h-svh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section className="relative hidden overflow-hidden border-r bg-muted/30 px-10 py-12 lg:flex lg:flex-col lg:justify-between">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--color-primary)_0%,transparent_50%)] opacity-[0.07]"
          />
          <AuthBrandPanel />
          <p className="text-muted-foreground text-xs">
            © Motorcycle Dealership ERP — MVP
          </p>
        </section>

        <section className="flex flex-col items-center justify-center px-6 py-10 sm:px-10">
          <div className="mb-8 w-full max-w-md lg:hidden">
            <AuthBrandPanel compact />
          </div>

          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  );
}
