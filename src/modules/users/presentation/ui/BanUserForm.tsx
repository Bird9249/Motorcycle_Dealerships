import { z } from "zod";
import {
  Button,
  FormActions,
  FormDatePicker,
  FormRoot,
  FormTextarea,
  RHF,
  zodResolver,
} from "@/components/kit";
import { toISOForAPI } from "@/shared/lib/date-time";

const BanFormSchema = z.object({
  reason: z.string().max(255).optional(),
  expires: z.date().optional(),
});

type BanFormValues = z.infer<typeof BanFormSchema>;

export function BanUserForm({
  submitting,
  onSubmit,
}: {
  submitting?: boolean;
  onSubmit: (values: { reason?: string; expires?: string }) => void;
}) {
  const methods = RHF.useForm<BanFormValues>({
    resolver: zodResolver(BanFormSchema),
    defaultValues: { reason: "", expires: undefined },
  });

  return (
    <FormRoot<BanFormValues>
      methods={methods}
      onSubmit={(vals) =>
        onSubmit({
          reason: vals.reason || undefined,
          expires: toISOForAPI(vals.expires),
        })
      }
      className="gap-3"
    >
      <FormTextarea name="reason" label="ເຫດຜົນ" placeholder="ເຫດຜົນ (ທາງເລືອກ)" />
      <FormDatePicker
        name="expires"
        label="ວັນໝົດອາຍຸ"
        placeholder="ເລືອກວັນທີ (ທາງເລືອກ)"
      />

      <FormActions>
        <Button type="submit" isLoading={submitting}>
          ຢືນຢັນການລະງັບ
        </Button>
      </FormActions>
    </FormRoot>
  );
}
