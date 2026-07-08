import { z } from "zod";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormActions,
  FormInput,
  FormRoot,
  FormSelect,
  FormTextarea,
  RHF,
  zodResolver,
} from "@/components/kit";
import type { CreatePaymentDTO } from "@/modules/payments/domain/contracts";
import { formatCurrencyAmount } from "@/modules/sales/presentation/lib/labels";
import { toISOForAPI } from "@/shared/lib/date-time";
import { useEffect, useMemo } from "react";
import type { PaymentAccountItem } from "../api/client";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { SlipUploader } from "./SlipUploader";

const schema = z
  .object({
    paymentAccountId: z.string().min(1, "ຕ້ອງເລືອກບັນຊີ"),
    amount: z.string().min(1, "ຕ້ອງໃສ່ຈຳນວນ"),
    paidAt: z.string().min(1, "ຕ້ອງເລືອກວັນຊຳລະ"),
    slipImageKey: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const amount = Number.parseFloat(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "ຈຳນວນຕ້ອງມາກກວ່າ 0",
        path: ["amount"],
      });
    }
  });

export type PaymentCreateFormValues = z.infer<typeof schema>;

type PaymentCreateFormProps = {
  accounts: PaymentAccountItem[];
  currency: "LAK" | "THB" | "USD";
  dueAmount: number;
  linkLabel: string;
  defaultAmount?: string;
  onSubmit: (input: CreatePaymentDTO) => void;
  submitting?: boolean;
  buildPayload: (
    values: PaymentCreateFormValues,
    account: PaymentAccountItem,
  ) => CreatePaymentDTO;
};

export function PaymentCreateForm({
  accounts,
  currency,
  dueAmount,
  linkLabel,
  defaultAmount,
  onSubmit,
  submitting,
  buildPayload,
}: PaymentCreateFormProps) {
  const filteredAccounts = useMemo(
    () => accounts.filter((a) => a.currency === currency && a.isActive),
    [accounts, currency],
  );

  const methods = RHF.useForm<PaymentCreateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      paymentAccountId: filteredAccounts[0]?.id ?? "",
      amount: defaultAmount ?? (dueAmount > 0 ? dueAmount.toFixed(2) : ""),
      paidAt: new Date().toISOString().slice(0, 16),
      slipImageKey: "",
      notes: "",
    },
  });

  const accountId = methods.watch("paymentAccountId");
  const selectedAccount = filteredAccounts.find((a) => a.id === accountId) ?? null;
  const isBank = selectedAccount?.type === "bank_transfer";

  useEffect(() => {
    if (
      filteredAccounts.length > 0 &&
      !filteredAccounts.some((a) => a.id === accountId)
    ) {
      methods.setValue("paymentAccountId", filteredAccounts[0]!.id);
    }
  }, [filteredAccounts, accountId, methods]);

  const handleSubmit = methods.handleSubmit((values) => {
    if (!selectedAccount) return;
    if (isBank && !values.slipImageKey?.trim()) {
      methods.setError("slipImageKey", {
        message: "ຕ້ອງແນບສລິບສຳລັບໂອນທະນາຄານ",
      });
      return;
    }
    const amount = Number.parseFloat(values.amount);
    if (amount > dueAmount + 0.001) {
      methods.setError("amount", {
        message: `ຍອດຄ້າງຊຳລະ ${dueAmount.toFixed(2)}`,
      });
      return;
    }
    onSubmit(buildPayload(values, selectedAccount));
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ອ້າງອີງ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{linkLabel}</p>
            <p className="text-muted-foreground">
              ຍອດຄ້າງຊຳລະ:{" "}
              <span className="font-medium text-foreground">
                {formatCurrencyAmount(dueAmount.toFixed(2), currency)}
              </span>
            </p>
          </CardContent>
        </Card>

        <FormRoot methods={methods} onSubmit={handleSubmit}>
          <FormSelect
            name="paymentAccountId"
            label="ບັນຊີຮັບເງິນ"
            placeholder="ເລືອກບັນຊີ"
            options={filteredAccounts.map((a) => ({
              value: a.id,
              label: `${a.name} (${a.type === "cash" ? "ເງິນສົດ" : "ໂອນ"})`,
            }))}
          />
            <FormInput
              name="amount"
              label="ຈຳນວນເງິນ"
              type="number"
              step="0.01"
              min="0"
            />
            <FormInput
              name="paidAt"
              label="ວັນເວລາຊຳລະ"
              type="datetime-local"
            />
            <SlipUploader
              value={methods.watch("slipImageKey") ?? ""}
              onChange={(key) =>
                methods.setValue("slipImageKey", key, { shouldValidate: true })
              }
              disabled={submitting}
              required={isBank}
            />
            {methods.formState.errors.slipImageKey ? (
              <p className="text-destructive text-sm">
                {methods.formState.errors.slipImageKey.message}
              </p>
            ) : null}
            <FormTextarea name="notes" label="ໝາຍເຫດ" rows={2} />
            <FormActions>
              <Button type="submit" disabled={submitting || !filteredAccounts.length}>
                ບັນທຶກການຊຳລະ
              </Button>
            </FormActions>
        </FormRoot>
      </div>

      <QRCodeDisplay account={selectedAccount} />
    </div>
  );
}

export function buildPaymentCreatePayload(
  base: {
    salesOrderId?: string | null;
    paymentScheduleId?: string | null;
  },
  values: PaymentCreateFormValues,
  account: PaymentAccountItem,
): CreatePaymentDTO {
  const paidAtIso = toISOForAPI(new Date(values.paidAt));
  return {
    salesOrderId: base.salesOrderId ?? null,
    paymentScheduleId: base.paymentScheduleId ?? null,
    paymentAccountId: account.id,
    amount: values.amount,
    currency: account.currency,
    paymentMethod: account.type === "cash" ? "cash" : "bank_transfer",
    paidAt: paidAtIso ? new Date(paidAtIso) : new Date(),
    slipImageKey: values.slipImageKey?.trim() || null,
    notes: values.notes?.trim() || null,
  };
}
