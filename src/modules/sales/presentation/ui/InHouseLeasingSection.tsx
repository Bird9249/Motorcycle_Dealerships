import { useEffect } from "react";
import {
  Button,
  FormInput,
  FormNativeSelect,
  FormRoot,
  RHF,
  zodResolver,
} from "@/components/kit";
import { z } from "zod";
import { CURRENCY_OPTIONS } from "../lib/labels";

const schema = z.object({
  downPayment: z.string().optional(),
  downPaymentCurrency: z.enum(["LAK", "THB", "USD"]).optional(),
  installmentMonths: z.string().min(1, "ຕ້ອງໃສ່ຈຳນວນງວດ"),
  interestRatePercent: z.string().min(1, "ຕ້ອງໃສ່ດອກເບີ້ຍ"),
});

export type InHouseLeasingValues = {
  downPayment?: string;
  downPaymentCurrency?: "LAK" | "THB" | "USD";
  installmentMonths: number;
  interestRatePercent: string;
};

type InHouseLeasingSectionProps = {
  defaultValues?: Partial<InHouseLeasingValues>;
  onChange: (values: InHouseLeasingValues) => void;
  onPreview?: () => void;
  previewLoading?: boolean;
  previewResult?: {
    monthlyInstallment: string;
    schedules: Array<{ installmentNumber: number; dueDate: string; amount: string }>;
  } | null;
};

export function InHouseLeasingSection({
  defaultValues,
  onChange,
  onPreview,
  previewLoading,
  previewResult,
}: InHouseLeasingSectionProps) {
  const form = RHF.useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      downPayment: defaultValues?.downPayment ?? "",
      downPaymentCurrency: defaultValues?.downPaymentCurrency ?? "LAK",
      installmentMonths: defaultValues?.installmentMonths
        ? String(defaultValues.installmentMonths)
        : "12",
      interestRatePercent: defaultValues?.interestRatePercent ?? "12",
    },
  });

  useEffect(() => {
    const sub = form.watch((values) => {
      const months = Number.parseInt(values.installmentMonths ?? "", 10);
      if (months > 0 && values.interestRatePercent) {
        onChange({
          downPayment: values.downPayment || undefined,
          downPaymentCurrency: values.downPaymentCurrency,
          installmentMonths: months,
          interestRatePercent: values.interestRatePercent,
        });
      }
    });
    return () => sub.unsubscribe();
  }, [form, onChange]);

  return (
    <div className="space-y-4">
      <FormRoot<z.infer<typeof schema>>
        methods={form}
        onSubmit={() => {}}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput name="downPayment" label="ເງິນດາວ" placeholder="0.00" />
          <FormNativeSelect
            name="downPaymentCurrency"
            label="ສະກຸນ (ດາວ)"
            options={[...CURRENCY_OPTIONS]}
          />
          <FormInput
            name="installmentMonths"
            label="ຈຳນວນງວດ (ເດືອນ)"
            requiredMark
          />
          <FormInput
            name="interestRatePercent"
            label="ດອກເບີ້ຍ (%/ປີ)"
            requiredMark
          />
        </div>
      </FormRoot>

      {onPreview ? (
        <Button
          type="button"
          variant="outline"
          onClick={onPreview}
          disabled={previewLoading}
        >
          {previewLoading ? "ກຳລັງຄິດໄລ່..." : "Preview ຕາຕະລາງຜ່ອນ"}
        </Button>
      ) : null}

      {previewResult ? (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <p className="font-medium">
            ຄ່າງວດ/ເດືອນ:{" "}
            {Number(previewResult.monthlyInstallment).toLocaleString()}
          </p>
          <div className="mt-3 max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-1 text-left">ງວດ</th>
                  <th className="py-1 text-left">ກຳນົດ</th>
                  <th className="py-1 text-right">ຈຳນວນ</th>
                </tr>
              </thead>
              <tbody>
                {previewResult.schedules.map((row) => (
                  <tr key={row.installmentNumber} className="border-b border-muted">
                    <td className="py-1 tabular-nums">{row.installmentNumber}</td>
                    <td className="py-1">{row.dueDate.slice(0, 10)}</td>
                    <td className="py-1 text-right tabular-nums">
                      {Number(row.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
