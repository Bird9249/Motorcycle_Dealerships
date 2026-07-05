import { useEffect } from "react";
import { z } from "zod";
import {
  Button,
  FormActions,
  FormCheckbox,
  FormInput,
  FormRoot,
  Input,
  Label,
  RHF,
  zodResolver,
} from "@/components/kit";
import type {
  ColorDTO,
  CreateColorDTO,
  UpdateColorDTO,
} from "@/modules/master-data/domain/contracts";

const hexPattern = /^#[0-9A-Fa-f]{6}$/;

const ColorFormSchema = z.object({
  name: z.string().trim().min(1, "ຕ້ອງໃສ່ຊື່ສີ"),
  hexCode: z.union([
    z.literal(""),
    z.string().trim().regex(hexPattern, "Hex code ຕ້ອງເປັນ #RRGGBB"),
  ]),
  isActive: z.boolean(),
});

export type ColorFormValues = z.infer<typeof ColorFormSchema>;

type ColorFormProps = {
  initialValues?: Partial<ColorFormValues>;
  editing?: boolean;
  onSubmit: (values: CreateColorDTO | UpdateColorDTO) => void;
  submitting?: boolean;
};

function HexColorPicker({ name }: { name: string }) {
  const { register, setValue, watch } = RHF.useFormContext<ColorFormValues>();
  const hexCode = watch(name) ?? "";
  const pickerValue = hexPattern.test(hexCode) ? hexCode : "#000000";

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>ລະຫັດສີ (Hex)</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={pickerValue}
          onChange={(e) => setValue(name, e.target.value.toUpperCase())}
          className="size-10 cursor-pointer rounded border bg-transparent p-0.5"
          aria-label="ເລືອກສີ"
        />
        <Input
          id={name}
          placeholder="#FF0000"
          className="font-mono uppercase"
          {...register(name)}
        />
        {hexPattern.test(hexCode) ? (
          <span
            className="size-8 shrink-0 rounded-md border shadow-sm"
            style={{ backgroundColor: hexCode }}
            title={hexCode}
          />
        ) : null}
      </div>
    </div>
  );
}

export function ColorForm({
  initialValues,
  editing = false,
  onSubmit,
  submitting,
}: ColorFormProps) {
  const methods = RHF.useForm<ColorFormValues>({
    resolver: zodResolver(ColorFormSchema),
    defaultValues: {
      name: "",
      hexCode: "",
      isActive: true,
      ...initialValues,
    },
  });

  const hexCode = methods.watch("hexCode");

  useEffect(() => {
    if (!hexCode) return;
    const normalized = hexCode.startsWith("#") ? hexCode : `#${hexCode}`;
    if (normalized !== hexCode && hexPattern.test(normalized.toUpperCase())) {
      methods.setValue("hexCode", normalized.toUpperCase());
    }
  }, [hexCode, methods]);

  return (
    <FormRoot<ColorFormValues>
      methods={methods}
      onSubmit={(vals) => {
        onSubmit({
          name: vals.name.trim(),
          hexCode: vals.hexCode?.trim() ? vals.hexCode.trim().toUpperCase() : null,
          isActive: vals.isActive,
        });
      }}
    >
      <FormInput
        name="name"
        label="ຊື່ສີ"
        requiredMark
        placeholder="ຕົວຢ່າງ: ແດງ"
      />
      <HexColorPicker name="hexCode" />
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

export function colorToFormValues(color: ColorDTO): ColorFormValues {
  return {
    name: color.name,
    hexCode: color.hexCode ?? "",
    isActive: color.isActive,
  };
}
