import { z } from "zod";
import {
  Button,
  FormActions,
  FormInput,
  FormRoot,
  FormSelect,
  FormTextarea,
  RHF,
  zodResolver,
} from "@/components/kit";
import { CreateServiceRecordSchema } from "@/modules/after-sales/domain/contracts";
import { toISOForAPI } from "@/shared/lib/date-time";
import { SERVICE_TYPE_OPTIONS } from "../lib/labels";

const schema = CreateServiceRecordSchema.extend({
  performedAtLocal: z.string().min(1, "ຕ້ອງເລືອກວັນທີ"),
});

export type ServiceRecordFormValues = z.infer<typeof schema>;

type ServiceRecordFormProps = {
  vehicleId: string;
  customerId: string;
  isEv?: boolean;
  initialValues?: Partial<ServiceRecordFormValues>;
  onSubmit: (values: ServiceRecordFormValues) => void;
  submitting?: boolean;
};

export function ServiceRecordForm({
  vehicleId,
  customerId,
  isEv = false,
  initialValues,
  onSubmit,
  submitting,
}: ServiceRecordFormProps) {
  const methods = RHF.useForm<ServiceRecordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleId,
      customerId,
      serviceType: "general",
      odometerKm: undefined,
      description: "",
      performedAtLocal: new Date().toISOString().slice(0, 16),
      batteryHealthPercent: undefined,
      batteryNotes: "",
      ...initialValues,
    },
  });

  return (
    <FormRoot<ServiceRecordFormValues>
      methods={methods}
      onSubmit={(vals) => onSubmit(vals)}
    >
      <input type="hidden" {...methods.register("vehicleId")} />
      <input type="hidden" {...methods.register("customerId")} />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormSelect
          name="serviceType"
          label="ປະເພດບໍລິການ"
          requiredMark
          options={SERVICE_TYPE_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
        />
        <FormInput
          name="performedAtLocal"
          label="ວັນທີເຂົ້າບໍລິການ"
          type="datetime-local"
          requiredMark
        />
        <FormInput
          name="odometerKm"
          label="ໄມລ໌ (ກມ.)"
          type="number"
          min={0}
        />
      </div>

      <FormTextarea
        name="description"
        label="ລາຍລະອຽດ"
        rows={3}
        requiredMark
      />

      {isEv ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            name="batteryHealthPercent"
            label="ສຸຂະພາບແບດ (%)"
            type="number"
            min={0}
            max={100}
          />
          <FormTextarea name="batteryNotes" label="ໝາຍເຫດແບດ" rows={2} />
        </div>
      ) : null}

      <FormActions>
        <Button type="submit" isLoading={submitting}>
          ບັນທຶກເຂົ້າບໍລິການ
        </Button>
      </FormActions>
    </FormRoot>
  );
}

export function buildServiceRecordPayload(
  values: ServiceRecordFormValues,
): z.infer<typeof CreateServiceRecordSchema> {
  const odometer =
    values.odometerKm == null || values.odometerKm === ("" as unknown)
      ? null
      : Number(values.odometerKm);
  const batteryHealth =
    values.batteryHealthPercent == null ||
    values.batteryHealthPercent === ("" as unknown)
      ? null
      : Number(values.batteryHealthPercent);

  return {
    vehicleId: values.vehicleId,
    customerId: values.customerId,
    serviceType: values.serviceType,
    odometerKm: Number.isFinite(odometer) ? odometer : null,
    description: values.description.trim(),
    performedAt: new Date(toISOForAPI(values.performedAtLocal)),
    batteryHealthPercent: Number.isFinite(batteryHealth) ? batteryHealth : null,
    batteryNotes: values.batteryNotes?.trim() || null,
  };
}
