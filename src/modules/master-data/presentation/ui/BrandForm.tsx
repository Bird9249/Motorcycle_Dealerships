import { z } from "zod";
import {
  Button,
  FormActions,
  FormCheckbox,
  FormInput,
  FormRoot,
  RHF,
  zodResolver,
} from "@/components/kit";
import type {
  BrandDTO,
  CreateBrandDTO,
  UpdateBrandDTO,
} from "@/modules/master-data/domain/contracts";

const BrandFormSchema = z.object({
  name: z.string().trim().min(1, "ຕ້ອງໃສ່ຊື່ຍີ່ຫໍ້"),
  slug: z
    .union([
      z.literal(""),
      z
        .string()
        .trim()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug ຕ້ອງເປັນຕົວພິມນ້ອຍ a-z, 0-9, ຂີດ"),
    ])
    .optional(),
  isActive: z.boolean(),
});

export type BrandFormValues = z.infer<typeof BrandFormSchema>;

type BrandFormProps = {
  initialValues?: Partial<BrandFormValues>;
  editing?: boolean;
  onSubmit: (values: CreateBrandDTO | UpdateBrandDTO) => void;
  submitting?: boolean;
};

export function BrandForm({
  initialValues,
  editing = false,
  onSubmit,
  submitting,
}: BrandFormProps) {
  const methods = RHF.useForm<BrandFormValues>({
    resolver: zodResolver(BrandFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      isActive: true,
      ...initialValues,
    },
  });

  return (
    <FormRoot<BrandFormValues>
      methods={methods}
      onSubmit={(vals) => {
        const payload = {
          name: vals.name.trim(),
          isActive: vals.isActive,
          ...(vals.slug?.trim() ? { slug: vals.slug.trim() } : {}),
        };
        onSubmit(payload);
      }}
    >
      <FormInput
        name="name"
        label="ຊື່ຍີ່ຫໍ້"
        requiredMark
        placeholder="ຕົວຢ່າງ: Honda"
      />
      <FormInput
        name="slug"
        label="Slug"
        hint={
          editing
            ? "ແກ້ໄຂ slug ໄດ້ — ຕ້ອງບໍ່ຊ້ຳກັນ"
            : "ປ່ອຍວ່າງເພື່ອສ້າງອັດຕະໂນມັດຈາກຊື່"
        }
        placeholder="honda"
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

export function brandToFormValues(brand: BrandDTO): BrandFormValues {
  return {
    name: brand.name,
    slug: brand.slug,
    isActive: brand.isActive,
  };
}
