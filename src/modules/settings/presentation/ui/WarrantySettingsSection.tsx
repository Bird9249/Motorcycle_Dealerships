import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  cn,
} from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import type { WarrantySettingsDTO } from "@/modules/after-sales/domain/contracts";
import {
  useUpdateWarrantySettings,
  useWarrantySettingsQuery,
} from "@/modules/after-sales/presentation/api/queries";
import { formatDateTimeLocal } from "@/shared/lib/date-time";
import { QueryState } from "@/shared/ui/QueryState";
import {
  BatteryChargingIcon,
  BikeIcon,
  ClockIcon,
  CogIcon,
  InfoIcon,
  ShieldCheckIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { WarrantySettingsForm } from "./WarrantySettingsForm";

type WarrantyStatConfig = {
  key: keyof Pick<
    WarrantySettingsDTO,
    "vehicleMonths" | "motorMonths" | "batteryMonths"
  >;
  label: string;
  hint: string;
  appliesTo: string;
  icon: LucideIcon;
  accent: string;
  iconBg: string;
};

const WARRANTY_STATS: WarrantyStatConfig[] = [
  {
    key: "vehicleMonths",
    label: "ປະກັນຕົວລົດ",
    hint: "ຄຸ້ມຄອງຕົວຖັງ ແລະ ອຸປະກອນຫຼັກ",
    appliesTo: "ICE + EV",
    icon: BikeIcon,
    accent: "border-l-primary",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    key: "motorMonths",
    label: "ປະກັນມໍເຕີ",
    hint: "ຄຸ້ມຄອງມໍເຕີໄຟຟ້າ / ນ້ຳມັນ",
    appliesTo: "ICE + EV",
    icon: CogIcon,
    accent: "border-l-amber-500",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    key: "batteryMonths",
    label: "ປະກັນແບດ",
    hint: "ຄັດລອກເລກຊີຣຽນແບດຈາກລົດ",
    appliesTo: "EV ເທົ່ານັ້ນ",
    icon: BatteryChargingIcon,
    accent: "border-l-emerald-500",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
];

function formatYears(months: number): string {
  const years = months / 12;
  if (Number.isInteger(years)) return `${years} ປີ`;
  return `~${years.toFixed(1)} ປີ`;
}

function WarrantyStatCard({
  config,
  months,
}: {
  config: WarrantyStatConfig;
  months: number;
}) {
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-l-4 bg-muted/20 p-4 transition-colors hover:bg-muted/30",
        config.accent,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn("rounded-lg p-2.5", config.iconBg)}>
          <Icon className="size-5" />
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs">
          {config.appliesTo}
        </Badge>
      </div>
      <div>
        <p className="font-medium text-sm">{config.label}</p>
        <p className="mt-1 font-semibold text-2xl tabular-nums tracking-tight">
          {months}
          <span className="ml-1 font-normal text-base text-muted-foreground">
            ເດືອນ
          </span>
        </p>
        <p className="text-muted-foreground text-xs">
          {formatYears(months)} · {config.hint}
        </p>
      </div>
    </div>
  );
}

export function WarrantySettingsSection() {
  const settings = useWarrantySettingsQuery();
  const updateSettings = useUpdateWarrantySettings();
  const canManage = useActionPermission(["after-sales:manage-warranty"]);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="border-b bg-muted/15 pb-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <ShieldCheckIcon className="size-6" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">ລະຍະເວລາປະກັນເລີ່ມຕົ້ນ</CardTitle>
                <Badge variant="outline">ອັດຕະໂນມັດຕອນຢືນຢັນຂາຍ</Badge>
              </div>
              <CardDescription className="max-w-2xl text-sm leading-relaxed">
                ສ້າງບັນທຶກປະກັນທັນທີເມື່ອຢືນຢັນຄຳສັ່ງຂາຍ — ລົດ ICE ໄດ້ 2 ປະເພດ,
                ລົດ EV ໄດ້ 3 ປະເພດ (ລວມແບດ)
              </CardDescription>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="secondary">ICE → ຕົວລົດ + ມໍເຕີ</Badge>
                <Badge variant="secondary">EV → ຕົວລົດ + ມໍເຕີ + ແບດ</Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <QueryState
            result={settings}
            isEmpty={!settings.data}
            title="ການຕັ້ງຄ່າປະກັນ"
            variant="inline"
          >
            {settings.data ? (
              <>
                <div className="grid gap-4 lg:grid-cols-3">
                  {WARRANTY_STATS.map((config) => (
                    <WarrantyStatCard
                      key={config.key}
                      config={config}
                      months={settings.data[config.key]}
                    />
                  ))}
                </div>

                <div className="flex gap-3 rounded-lg border border-dashed bg-muted/10 px-4 py-3 text-sm">
                  <InfoIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <p className="text-muted-foreground leading-relaxed">
                    ການປ່ຽນແປງມີຜົນກັບການຂາຍທີ່ຢືນຢັນ
                    <strong className="font-medium text-foreground">
                      {" "}
                      ຫຼັງຈາກ
                    </strong>{" "}
                    ບັນທຶກການຕັ້ງຄ່າ — ການຂາຍເກົ່າຍັງໃຊ້ຄ່າເດີມ
                  </p>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <ClockIcon className="size-3.5" />
                  <span>
                    ອັບເດດລ່າສຸດ:{" "}
                    {formatDateTimeLocal(settings.data.updatedAt)}
                  </span>
                </div>

                {canManage ? (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-sm">ແກ້ໄຂລະຍະເວລາ</h3>
                        <p className="text-muted-foreground text-xs">
                          ກຳນົດເດືອນສຳລັບແຕ່ລະປະເພດປະກັນ (1–120 ເດືອນ)
                        </p>
                      </div>
                      <WarrantySettingsForm
                        key={settings.data.updatedAt.toString()}
                        settings={settings.data}
                        submitting={updateSettings.isPending}
                        onSubmit={(values) => updateSettings.mutate(values)}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    ຕ້ອງມີສິດ «ຈັດການປະກັນ» ເພື່ອແກ້ໄຂຄ່າເຫຼົ່ານີ້
                  </p>
                )}
              </>
            ) : null}
          </QueryState>
        </CardContent>
      </Card>
    </div>
  );
}
