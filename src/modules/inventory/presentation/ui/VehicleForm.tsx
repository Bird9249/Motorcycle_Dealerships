import {
  BatteryChargingIcon,
  BikeIcon,
  ClipboardListIcon,
  CoinsIcon,
  FileCheckIcon,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { z } from "zod";
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormActions,
  FormCheckbox,
  FormDatePicker,
  FormInput,
  FormNativeSelect,
  FormRoot,
  FormTextarea,
  RHF,
  zodResolver,
} from "@/components/kit";
import { useBrandsQuery, useColorsQuery, useModelsQuery } from "../api/queries";
import { CURRENCY_OPTIONS } from "../lib/labels";

const baseSchema = z.object({
  modelId: z.string().min(1, "ຕ້ອງເລືອກລຸ່ນ"),
  colorId: z.string().min(1, "ຕ້ອງເລືອກສີ"),
  chassisNumber: z.string().optional(),
  engineNumber: z.string().optional(),
  batterySerialNumber: z.string().optional(),
  batteryCapacityKwh: z.string().optional(),
  costPrice: z.string().min(1, "ຕ້ອງໃສ່ລາຄາຕົ້ນທຶນ"),
  costCurrency: z.enum(["LAK", "THB", "USD"]),
  listPrice: z.string().min(1, "ຕ້ອງໃສ່ລາຄາຂາຍ"),
  listCurrency: z.enum(["LAK", "THB", "USD"]),
  importInvoiceReceived: z.boolean(),
  technicalInspectionReceived: z.boolean(),
  importDate: z.union([z.date(), z.string(), z.null()]).optional(),
  notes: z.string().optional().nullable(),
});

export type VehicleFormValues = z.infer<typeof baseSchema>;

type VehicleFormProps = {
  initialValues?: Partial<VehicleFormValues>;
  locked?: boolean;
  onSubmit: (values: VehicleFormValues) => void;
  submitting?: boolean;
};

type FormSectionProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
};

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function VehicleForm({
  initialValues,
  locked = false,
  onSubmit,
  submitting,
}: VehicleFormProps) {
  const brands = useBrandsQuery();
  const models = useModelsQuery();
  const colors = useColorsQuery();

  const methods = RHF.useForm<VehicleFormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      modelId: "",
      colorId: "",
      chassisNumber: "",
      engineNumber: "",
      batterySerialNumber: "",
      batteryCapacityKwh: "",
      costPrice: "",
      costCurrency: "LAK",
      listPrice: "",
      listCurrency: "LAK",
      importInvoiceReceived: false,
      technicalInspectionReceived: false,
      importDate: null,
      notes: "",
      ...initialValues,
    },
  });

  const modelId = methods.watch("modelId");

  const selectedModel = useMemo(
    () => models.data?.find((m) => m.id === modelId),
    [modelId, models.data],
  );

  const vehicleType = selectedModel?.vehicleType;

  useEffect(() => {
    if (!selectedModel?.batteryCapacityKwh) return;
    const current = methods.getValues("batteryCapacityKwh");
    if (!current) {
      methods.setValue(
        "batteryCapacityKwh",
        selectedModel.batteryCapacityKwh ?? "",
      );
    }
  }, [methods, selectedModel]);

  const modelOptions = useMemo(() => {
    const list = models.data ?? [];
    const brandMap = new Map(
      (brands.data ?? []).map((b) => [b.id, b.name] as const),
    );
    return list.map((m) => ({
      value: m.id,
      label: `${brandMap.get(m.brandId) ?? ""} — ${m.name} (${m.vehicleType === "ev" ? "EV" : "ICE"})`,
    }));
  }, [brands.data, models.data]);

  const colorOptions = useMemo(
    () =>
      (colors.data ?? []).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    [colors.data],
  );

  const currencyOptions = CURRENCY_OPTIONS.map((c) => ({
    value: c.value,
    label: c.label,
  }));

  const submit = (vals: VehicleFormValues) => {
    if (vehicleType === "ice") {
      if (!vals.chassisNumber?.trim() || !vals.engineNumber?.trim()) {
        if (!vals.chassisNumber?.trim()) {
          methods.setError("chassisNumber", {
            message: "ຕ້ອງໃສ່ເລກຖັງ",
          });
        }
        if (!vals.engineNumber?.trim()) {
          methods.setError("engineNumber", {
            message: "ຕ້ອງໃສ່ເລກຈັກ",
          });
        }
        return;
      }
    }

    if (vehicleType === "ev" && !vals.batterySerialNumber?.trim()) {
      methods.setError("batterySerialNumber", {
        message: "ຕ້ອງໃສ່ເລກແບັດເຕີຣີ",
      });
      return;
    }

    onSubmit(vals);
  };

  return (
    <FormRoot<VehicleFormValues> methods={methods} onSubmit={submit}>
      <div className="space-y-6">
        {locked ? (
          <Alert>
            <AlertDescription>
              ລົດຄັນນີ້ຖືກຈອງ ຫຼື ຂາຍແລ້ວ — ບໍ່ສາມາດແກ້ໄຂໄດ້
            </AlertDescription>
          </Alert>
        ) : null}

        <FormSection
          icon={BikeIcon}
          title="ຂໍ້ມູນພື້ນຖານ"
          description="ເລືອກລຸ່ນ ແລະ ສີຂອງລົດ"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormNativeSelect
              name="modelId"
              label="ລຸ່ນລົດ"
              requiredMark
              placeholder="ເລືອກລຸ່ນ..."
              options={modelOptions}
              disabled={locked}
            />
            <FormNativeSelect
              name="colorId"
              label="ສີ"
              requiredMark
              placeholder="ເລືອກສີ..."
              options={colorOptions}
              disabled={locked}
            />
          </div>
        </FormSection>

        {vehicleType === "ice" ? (
          <FormSection
            icon={BikeIcon}
            title="ຂໍ້ມູນລົດນ້ຳມັນ (ICE)"
            description="ເລກຖັງ ແລະ ເລກຈັກຕ້ອງບໍ່ຊ້ຳກັນ"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                name="chassisNumber"
                label="ເລກຖັງ"
                requiredMark
                disabled={locked}
              />
              <FormInput
                name="engineNumber"
                label="ເລກຈັກ"
                requiredMark
                disabled={locked}
              />
            </div>
          </FormSection>
        ) : null}

        {vehicleType === "ev" ? (
          <FormSection
            icon={BatteryChargingIcon}
            title="ຂໍ້ມູນລົດໄຟຟ້າ (EV)"
            description="ເລກແບັດເຕີຣີ ແລະ ຄວາມຈຸພະລັງງານ"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput name="chassisNumber" label="ເລກຖັງ" disabled={locked} />
              <FormInput
                name="batterySerialNumber"
                label="ເລກແບັດເຕີຣີ"
                requiredMark
                disabled={locked}
              />
              <FormInput
                name="batteryCapacityKwh"
                label="ຄວາມຈຸແບັດ (kWh)"
                disabled={locked}
              />
            </div>
          </FormSection>
        ) : null}

        <FormSection
          icon={CoinsIcon}
          title="ລາຄາ"
          description="ລາຄາຕົ້ນທຶນ ແລະ ລາຄາຂາຍຕາມສະກຸນເງິນ"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              name="costPrice"
              label="ລາຄາຕົ້ນທຶນ"
              requiredMark
              disabled={locked}
            />
            <FormNativeSelect
              name="costCurrency"
              label="ສະກຸນ (ຕົ້ນທຶນ)"
              options={currencyOptions}
              disabled={locked}
            />
            <FormInput
              name="listPrice"
              label="ລາຄາຂາຍ"
              requiredMark
              disabled={locked}
            />
            <FormNativeSelect
              name="listCurrency"
              label="ສະກຸນ (ຂາຍ)"
              options={currencyOptions}
              disabled={locked}
            />
          </div>
        </FormSection>

        <FormSection
          icon={FileCheckIcon}
          title="ເອກະສານນຳເຂົ້າ"
          description="ສະຖານະເອກະສານສຳລັບການຈົດທະບຽນ"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <FormCheckbox
              name="importInvoiceReceived"
              label="ໄດ້ຮັບໃບເສຍພາສີແລ້ວ"
              disabled={locked}
            />
            <FormCheckbox
              name="technicalInspectionReceived"
              label="ໄດ້ຮັບໃບກວດກາເຕັກນິກແລ້ວ"
              disabled={locked}
            />
          </div>
        </FormSection>

        <FormSection
          icon={ClipboardListIcon}
          title="ລາຍລະອຽດເພີ່ມເຕີມ"
          description="ວັນນຳເຂົ້າ ແລະ ໝາຍເຫດ"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormDatePicker
              name="importDate"
              label="ວັນນຳເຂົ້າ"
              disabled={locked}
            />
            <FormTextarea name="notes" label="ໝາຍເຫດ" disabled={locked} />
          </div>
        </FormSection>

        {!locked ? (
          <FormActions className="rounded-xl border bg-muted/30 px-4 py-3">
            <Button type="submit" isLoading={submitting} className="min-w-28">
              ບັນທຶກ
            </Button>
          </FormActions>
        ) : null}
      </div>
    </FormRoot>
  );
}
