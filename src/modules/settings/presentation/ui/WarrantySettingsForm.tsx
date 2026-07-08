import { z } from "zod";
import {
  Button,
  FormActions,
  FormInput,
  FormRoot,
  RHF,
  zodResolver,
} from "@/components/kit";
import type { WarrantySettingsDTO } from "@/modules/after-sales/domain/contracts";
import {
  BatteryChargingIcon,
  BikeIcon,
  CogIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const schema = z.object({
  vehicleMonths: z.coerce.number().int().min(1).max(120),
  motorMonths: z.coerce.number().int().min(1).max(120),
  batteryMonths: z.coerce.number().int().min(1).max(120),
});

type FormValues = z.infer<typeof schema>;

type FieldConfig = {
  name: keyof FormValues;
  label: string;
  icon: LucideIcon;
};

const FIELDS: FieldConfig[] = [
  { name: "vehicleMonths", label: "ປະກັນຕົວລົດ", icon: BikeIcon },
  { name: "motorMonths", label: "ປະກັນມໍເຕີ", icon: CogIcon },
  { name: "batteryMonths", label: "ປະກັນແບດ EV", icon: BatteryChargingIcon },
];

type WarrantySettingsFormProps = {
  settings: WarrantySettingsDTO;
  submitting?: boolean;
  onSubmit: (values: FormValues) => void;
};

export function WarrantySettingsForm({
  settings,
  submitting,
  onSubmit,
}: WarrantySettingsFormProps) {
  const methods = RHF.useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleMonths: settings.vehicleMonths,
      motorMonths: settings.motorMonths,
      batteryMonths: settings.batteryMonths,
    },
  });

  return (
    <FormRoot<FormValues>
      methods={methods}
      onSubmit={onSubmit}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {FIELDS.map(({ name, label, icon: Icon }) => (
          <div
            key={name}
            className="rounded-lg border bg-background p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-2 text-muted-foreground text-sm">
              <Icon className="size-4" />
              <span>{label}</span>
            </div>
            <FormInput
              name={name}
              label="ເດືອນ"
              type="number"
              requiredMark
              min={1}
              max={120}
            />
          </div>
        ))}
      </div>
      <FormActions className="pt-2">
        <Button type="submit" isLoading={submitting}>
          ບັນທຶກການຕັ້ງຄ່າ
        </Button>
      </FormActions>
    </FormRoot>
  );
}
