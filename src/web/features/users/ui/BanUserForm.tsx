import {
  Button,
  FormDatePicker,
  FormRoot,
  FormTextarea,
  RHF,
  zodResolver,
} from "@devhop/ui";
import { z } from "zod";

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
          expires: vals.expires ? vals.expires.toISOString() : undefined,
        })
      }
      className="space-y-3"
    >
      <FormTextarea
        name="reason"
        label="Reason"
        placeholder="Optional reason"
      />
      <FormDatePicker
        name="expires"
        label="Expires"
        placeholder="Select date (optional)"
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" isLoading={submitting}>
          Confirm ban
        </Button>
      </div>
    </FormRoot>
  );
}
