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
import type { FinanceCompanyItem } from "@/modules/sales/presentation/api/client";
import type {
  CreateFinanceCompanyDTO,
  UpdateFinanceCompanyDTO,
} from "@/modules/sales/domain/contracts";

const schema = z.object({
  name: z.string().trim().min(1, "ຕ້ອງໃສ່ຊື່"),
  code: z.string().trim().min(1, "ຕ້ອງໃສ່ລະຫັດ"),
  contactPhone: z.string().optional(),
  isActive: z.boolean(),
});

export type FinanceCompanyFormValues = z.infer<typeof schema>;

type FinanceCompanyFormProps = {
  initialValues?: Partial<FinanceCompanyFormValues>;
  editing?: boolean;
  onSubmit: (values: CreateFinanceCompanyDTO | UpdateFinanceCompanyDTO) => void;
  submitting?: boolean;
};

export function FinanceCompanyForm({
  initialValues,
  editing = false,
  onSubmit,
  submitting,
}: FinanceCompanyFormProps) {
  const methods = RHF.useForm<FinanceCompanyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      code: "",
      contactPhone: "",
      isActive: true,
      ...initialValues,
    },
  });

  return (
    <FormRoot<FinanceCompanyFormValues>
      methods={methods}
      onSubmit={(vals) =>
        onSubmit({
          name: vals.name.trim(),
          code: vals.code.trim(),
          contactPhone: vals.contactPhone?.trim() || null,
          ...(editing ? { isActive: vals.isActive } : {}),
        })
      }
    >
      <FormInput name="name" label="ຊື່ບໍລິສັດ" requiredMark />
      <FormInput
        name="code"
        label="ລະຫັດ"
        requiredMark
        placeholder="WELCOME"
        hint="ຕົວພິມໃຫญ่, ບໍ່ຊ້ຳກັນ"
      />
      <FormInput name="contactPhone" label="ເບີຕິດຕໍ່" placeholder="020..." />
      {editing ? <FormCheckbox name="isActive" label="ເປີດໃຊ້ງານ" /> : null}
      <FormActions>
        <Button type="submit" isLoading={submitting}>
          ບັນທຶກ
        </Button>
      </FormActions>
    </FormRoot>
  );
}

export function financeCompanyToFormValues(
  company: FinanceCompanyItem,
): FinanceCompanyFormValues {
  return {
    name: company.name,
    code: company.code,
    contactPhone: company.contactPhone ?? "",
    isActive: company.isActive,
  };
}
