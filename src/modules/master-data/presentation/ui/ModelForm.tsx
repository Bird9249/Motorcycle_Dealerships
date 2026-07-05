import { z } from "zod";
import { useEffect } from "react";
import {
  Button,
  FormActions,
  FormCheckbox,
  FormInput,
  FormNativeSelect,
  FormRoot,
  RHF,
  zodResolver,
} from "@/components/kit";
import type {
  CreateModelDTO,
  ModelDTO,
  UpdateModelDTO,
} from "@/modules/master-data/domain/contracts";
import { VEHICLE_TYPE_FORM_OPTIONS } from "../lib/labels";

const ModelFormSchema = z
  .object({
    brandId: z.string().min(1, "ຕ້ອງເລືອກຍີ່ຫໍ້"),
    name: z.string().trim().min(1, "ຕ້ອງໃສ່ຊື່ລຸ່ນ"),
    vehicleType: z.enum(["ice", "ev"]),
    engineCc: z.string().optional().or(z.literal("")),
    batteryCapacityKwh: z.string().optional().or(z.literal("")),
    year: z.string().optional().or(z.literal("")),
    isActive: z.boolean(),
  })
  .superRefine((vals, ctx) => {
    if (vals.vehicleType === "ice" && vals.batteryCapacityKwh?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "ລຸ່ນ ICE ບໍ່ຄວນມີຄວາມຈຸແບັດ",
        path: ["batteryCapacityKwh"],
      });
    }
    if (vals.vehicleType === "ev" && vals.engineCc?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "ລຸ່ນ EV ບໍ່ຄວນມີ CC",
        path: ["engineCc"],
      });
    }
  });

export type ModelFormValues = z.infer<typeof ModelFormSchema>;

type ModelFormProps = {
  brandOptions: ReadonlyArray<{ value: string; label: string }>;
  initialValues?: Partial<ModelFormValues>;
  editing?: boolean;
  onSubmit: (values: CreateModelDTO | UpdateModelDTO) => void;
  submitting?: boolean;
};

function toPayload(
  vals: ModelFormValues,
  isCreate: boolean,
): CreateModelDTO | UpdateModelDTO {
  const engineCc =
    vals.vehicleType === "ice" && vals.engineCc?.trim()
      ? Number.parseInt(vals.engineCc, 10)
      : null;
  const batteryCapacityKwh =
    vals.vehicleType === "ev" && vals.batteryCapacityKwh?.trim()
      ? vals.batteryCapacityKwh.trim()
      : null;
  const year = vals.year?.trim() ? Number.parseInt(vals.year, 10) : null;

  const base = {
    name: vals.name.trim(),
    vehicleType: vals.vehicleType,
    engineCc,
    batteryCapacityKwh,
    year,
    isActive: vals.isActive,
  };

  if (isCreate) {
    return { ...base, brandId: vals.brandId };
  }
  return base;
}

export function ModelForm({
  brandOptions,
  initialValues,
  editing = false,
  onSubmit,
  submitting,
}: ModelFormProps) {
  const methods = RHF.useForm<ModelFormValues>({
    resolver: zodResolver(ModelFormSchema),
    defaultValues: {
      brandId: "",
      name: "",
      vehicleType: "ice",
      engineCc: "",
      batteryCapacityKwh: "",
      year: "",
      isActive: true,
      ...initialValues,
    },
  });

  const vehicleType = methods.watch("vehicleType");

  useEffect(() => {
    if (vehicleType === "ice") {
      methods.setValue("batteryCapacityKwh", "");
    } else {
      methods.setValue("engineCc", "");
    }
  }, [vehicleType, methods]);

  return (
    <FormRoot<ModelFormValues>
      methods={methods}
      onSubmit={(vals) => onSubmit(toPayload(vals, !editing))}
    >
      <FormNativeSelect
        name="brandId"
        label="ຍີ່ຫໍ້"
        requiredMark
        placeholder="ເລືອກຍີ່ຫໍ້"
        options={brandOptions}
        disabled={editing}
      />
      <FormInput
        name="name"
        label="ຊື່ລຸ່ນ"
        requiredMark
        placeholder="ຕົວຢ່າງ: Wave 125i"
      />
      <FormNativeSelect
        name="vehicleType"
        label="ປະເພດ"
        requiredMark
        options={[...VEHICLE_TYPE_FORM_OPTIONS]}
      />
      {vehicleType === "ice" ? (
        <FormInput
          name="engineCc"
          label="CC ເຄື່ອງຍົນ"
          type="number"
          min={1}
          placeholder="125"
        />
      ) : (
        <FormInput
          name="batteryCapacityKwh"
          label="ຄວາມຈຸແບັດ (kWh)"
          placeholder="3.5"
        />
      )}
      <FormInput
        name="year"
        label="ປີລຸ່ນ"
        type="number"
        min={1900}
        max={2100}
        placeholder="2024"
      />
      {editing ? (
        <FormCheckbox name="isActive" label="ເປີດໃຊ້ງານ" />
      ) : null}
      <FormActions>
        <Button type="submit" isLoading={submitting}>
          ບັນທຶກ
        </Button>
      </FormActions>
    </FormRoot>
  );
}

export function modelToFormValues(model: ModelDTO): ModelFormValues {
  return {
    brandId: model.brandId,
    name: model.name,
    vehicleType: model.vehicleType,
    engineCc: model.engineCc != null ? String(model.engineCc) : "",
    batteryCapacityKwh: model.batteryCapacityKwh ?? "",
    year: model.year != null ? String(model.year) : "",
    isActive: model.isActive,
  };
}
