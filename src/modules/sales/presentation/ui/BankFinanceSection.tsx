import {
  FormInput,
  FormNativeSelect,
  FormRoot,
  RHF,
  zodResolver,
} from "@/components/kit";
import { useEffect } from "react";
import { z } from "zod";
import type { FinanceCompanyItem } from "../api/client";

const schema = z.object({
  financeCompanyId: z.string().min(1, "ຕ້ອງເລືອກບໍລິສັດໄຟແນນ"),
  financeApprovedAmount: z.string().optional(),
});

export type BankFinanceValues = z.infer<typeof schema>;

type BankFinanceSectionProps = {
  companies: FinanceCompanyItem[];
  defaultValues?: Partial<BankFinanceValues>;
  onChange: (values: BankFinanceValues) => void;
};

export function BankFinanceSection({
  companies,
  defaultValues,
  onChange,
}: BankFinanceSectionProps) {
  const form = RHF.useForm<BankFinanceValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      financeCompanyId: defaultValues?.financeCompanyId ?? "",
      financeApprovedAmount: defaultValues?.financeApprovedAmount ?? "",
    },
  });

  useEffect(() => {
    const sub = form.watch((values) => {
      if (values.financeCompanyId) {
        onChange(values as BankFinanceValues);
      }
    });
    return () => sub.unsubscribe();
  }, [form, onChange]);

  return (
    <FormRoot<BankFinanceValues> methods={form} onSubmit={() => {}}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormNativeSelect
          name="financeCompanyId"
          label="ບໍລິສັດໄຟແນນ"
          requiredMark
          options={companies.map((c) => ({
            value: c.id,
            label: `${c.name} (${c.code})`,
          }))}
        />
        <FormInput
          name="financeApprovedAmount"
          label="ວົງເງິນອະນຸມັດ"
          placeholder="0.00"
        />
      </div>
    </FormRoot>
  );
}
