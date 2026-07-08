import { z } from "zod";
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
  CreatePaymentAccountDTO,
  UpdatePaymentAccountDTO,
} from "@/modules/payments/domain/contracts";
import type { PaymentAccountItem } from "@/modules/payments/presentation/api/client";
import { ImageKeyUploadField } from "@/shared/ui/ImageKeyUploadField";

const schema = z
  .object({
    name: z.string().trim().min(1, "ຕ້ອງໃສ່ຊື່"),
    type: z.enum(["cash", "bank_transfer"]),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    currency: z.enum(["LAK", "THB", "USD"]),
    qrCodeImageKey: z.string().optional(),
    isActive: z.boolean(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "bank_transfer" && !data.bankName?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "ຕ້ອງໃສ່ຊື່ທະນາຄານ",
        path: ["bankName"],
      });
    }
  });

export type PaymentAccountFormValues = z.infer<typeof schema>;

type PaymentAccountFormProps = {
  initialValues?: Partial<PaymentAccountFormValues>;
  editing?: boolean;
  onSubmit: (
    values: CreatePaymentAccountDTO | UpdatePaymentAccountDTO,
  ) => void;
  submitting?: boolean;
};

const TYPE_OPTIONS = [
  { value: "cash", label: "ເງິນສົດ" },
  { value: "bank_transfer", label: "ໂອນທະນາຄານ" },
] as const;

const CURRENCY_OPTIONS = [
  { value: "LAK", label: "LAK" },
  { value: "THB", label: "THB" },
  { value: "USD", label: "USD" },
] as const;

export function paymentAccountToFormValues(
  account: PaymentAccountItem,
): PaymentAccountFormValues {
  return {
    name: account.name,
    type: account.type,
    bankName: account.bankName ?? "",
    accountNumber: account.accountNumber ?? "",
    currency: account.currency,
    qrCodeImageKey: account.qrCodeImageKey ?? "",
    isActive: account.isActive,
    displayOrder: account.displayOrder,
  };
}

export function PaymentAccountForm({
  initialValues,
  editing = false,
  onSubmit,
  submitting,
}: PaymentAccountFormProps) {
  const methods = RHF.useForm<PaymentAccountFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "bank_transfer",
      bankName: "",
      accountNumber: "",
      currency: "LAK",
      qrCodeImageKey: "",
      isActive: true,
      displayOrder: 0,
      ...initialValues,
    },
  });

  const accountType = methods.watch("type");

  return (
    <FormRoot<PaymentAccountFormValues>
      methods={methods}
      onSubmit={(values) => {
        onSubmit({
          name: values.name,
          type: values.type,
          bankName: values.type === "bank_transfer" ? values.bankName : null,
          accountNumber:
            values.type === "bank_transfer" ? values.accountNumber : null,
          currency: values.currency,
          qrCodeImageKey: values.qrCodeImageKey || null,
          isActive: values.isActive,
          displayOrder: values.displayOrder,
        });
      }}
    >
      <FormInput name="name" label="ຊື່ບັນຊີ" placeholder="ເຊັ່ນ BCEL — ບັນຊີ A" />
      <FormNativeSelect
        name="type"
        label="ປະເພດ"
        options={TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
      />
      {accountType === "bank_transfer" ? (
        <>
          <FormInput name="bankName" label="ທະນາຄານ" placeholder="BCEL, JDB..." />
          <FormInput
            name="accountNumber"
            label="ເລກບັນຊີ"
            placeholder="ທາງເລືອກ"
          />
        </>
      ) : null}
      <FormNativeSelect
        name="currency"
        label="ສະກຸນເງິນ"
        options={CURRENCY_OPTIONS.map((o) => ({
          value: o.value,
          label: o.label,
        }))}
      />
      <FormInput
        name="displayOrder"
        label="ລຳດັບການສະແດງ"
        type="number"
        min={0}
      />
      {accountType === "bank_transfer" ? (
        <RHF.Controller
          name="qrCodeImageKey"
          control={methods.control}
          render={({ field }) => (
            <ImageKeyUploadField
              label="QR Code ໂອນເງິນ"
              value={field.value ?? ""}
              onChange={field.onChange}
              keyPrefix="uploads/payment-accounts/qr"
              aspectRatio="aspect-square"
              aspectHint="1:1"
            />
          )}
        />
      ) : null}
      {editing ? <FormCheckbox name="isActive" label="ເປີດໃຊ້ງານ" /> : null}
      <FormActions>
        <Button type="submit" isLoading={submitting}>
          {editing ? "ບັນທຶກ" : "ເພີ່ມ"}
        </Button>
      </FormActions>
    </FormRoot>
  );
}
