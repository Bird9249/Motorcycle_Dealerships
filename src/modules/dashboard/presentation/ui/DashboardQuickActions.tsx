import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/kit";
import { usePermissions } from "@/modules/auth/presentation/model/usePermissions";
import type { PermissionId } from "@/modules/roles/domain/contracts/permissions";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Bike,
  Plus,
  ReceiptIcon,
  ShieldCheck,
  UserRound,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";

type QuickAction = {
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  permissions: PermissionId[];
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: "ສ້າງຄຳສັ່ງຂາຍ",
    description: "ເປີດຄຳສັ່ງຂາຍໃໝ່",
    icon: Plus,
    to: "/app/sales/new",
    permissions: ["sales:create"],
  },
  {
    title: "ຄຳສັ່ງຂາຍ",
    description: "ຈັດການລາຍການຂາຍ",
    icon: ReceiptIcon,
    to: "/app/sales",
    permissions: ["sales:read"],
  },
  {
    title: "ລາຍການລົດ",
    description: "ສຕັອກ ແລະ ສະຖານະລົດ",
    icon: Bike,
    to: "/app/inventory/vehicles",
    permissions: ["inventory:read"],
  },
  {
    title: "ລູກຄ້າ",
    description: "ຂໍ້ມູນລູກຄ້າ",
    icon: UserRound,
    to: "/app/customers",
    permissions: ["customers:read"],
  },
  {
    title: "ຮັບຊຳລະເງິນ",
    description: "ບັນທຶກການຊຳລະ",
    icon: Wallet,
    to: "/app/payments/new",
    permissions: ["payments:create"],
  },
  {
    title: "ການຊຳລະເງິນ",
    description: "ລາຍການຊຳລະ ແລະ ສະຖານະ",
    icon: Wallet,
    to: "/app/payments",
    permissions: ["payments:read"],
  },
  {
    title: "ປະກັນ",
    description: "ຕິດຕາມປະກັນຫຼັງການຂາຍ",
    icon: ShieldCheck,
    to: "/app/after-sales/warranties",
    permissions: ["after-sales:read"],
  },
  {
    title: "ເຂົ້າບໍລິການ",
    description: "ປະຫວັດການບໍລິການ",
    icon: Wrench,
    to: "/app/after-sales/service",
    permissions: ["after-sales:read"],
  },
  {
    title: "ລາຍງານ",
    description: "ສະຫຼຸບ ແລະ ສົ່ງອອກ CSV",
    icon: BarChart3,
    to: "/app/reports",
    permissions: ["reports:read"],
  },
];

function QuickActionCard({ action }: { action: QuickAction }) {
  const Icon = action.icon;

  return (
    <Link
      to={action.to}
      className="block h-full rounded-xl outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full gap-y-0 transition-colors hover:bg-muted/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4" />
            </span>
            {action.title}
          </CardTitle>
          <CardDescription>{action.description}</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </Link>
  );
}

export function DashboardQuickActions() {
  const { hasAll } = usePermissions();
  const visibleActions = useMemo(
    () => QUICK_ACTIONS.filter((action) => hasAll(action.permissions)),
    [hasAll],
  );

  if (visibleActions.length === 0) {
    return (
      <Card className="gap-y-0">
        <CardHeader>
          <CardTitle className="text-base">ຍິນດີຕ້ອນຮັບ</CardTitle>
          <CardDescription>
            ບໍ່ມີເມນູທີ່ເຂົ້າເຖິງໄດ້ໃນຂະນະນີ້ — ຕິດຕໍ່ຜູ້ດູແລລະບົບເພື່ອກຳນົດສິດ
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* <div>
        <h2 className="font-semibold text-lg">ທາງລັດ</h2>
        <p className="text-muted-foreground text-sm">
          ເຂົ້າເຖິງໜ້າທີ່ທ່ານໃຊ້ງານໄດ້
        </p>
      </div> */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleActions.map((action) => (
          <QuickActionCard key={action.to} action={action} />
        ))}
      </div>
    </div>
  );
}
