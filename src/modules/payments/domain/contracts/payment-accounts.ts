import { z } from "zod";

export const PaymentAccountTypeSchema = z.enum(["cash", "bank_transfer"]);

export const CurrencySchema = z.enum(["LAK", "THB", "USD"]);

export const IdParamSchema = z.object({ id: z.string().min(1) });

export const PaymentAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: PaymentAccountTypeSchema,
  bankName: z.string().nullable(),
  accountNumber: z.string().nullable(),
  currency: CurrencySchema,
  qrCodeImageKey: z.string().nullable(),
  isActive: z.boolean(),
  displayOrder: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const PaymentAccountBaseSchema = z.object({
  name: z.string().trim().min(1, "ຕ້ອງໃສ່ຊື່"),
  type: PaymentAccountTypeSchema,
  bankName: z.string().trim().optional().nullable(),
  accountNumber: z.string().trim().optional().nullable(),
  currency: CurrencySchema.default("LAK"),
  qrCodeImageKey: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
});

function refineBankName(
  data: { type: "cash" | "bank_transfer"; bankName?: string | null },
  ctx: z.RefinementCtx,
) {
  if (data.type === "bank_transfer" && !data.bankName?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "ຕ້ອງໃສ່ຊື່ທະນາຄານ",
      path: ["bankName"],
    });
  }
}

export const CreatePaymentAccountSchema = PaymentAccountBaseSchema.superRefine(
  refineBankName,
);

export const UpdatePaymentAccountSchema = PaymentAccountBaseSchema.partial().superRefine(
  (data, ctx) => {
    if (data.type === "bank_transfer") {
      refineBankName(
        { type: data.type, bankName: data.bankName ?? null },
        ctx,
      );
    }
  },
);

export const UpdatePaymentAccountStatusSchema = z.object({
  isActive: z.boolean(),
});

export const PaymentAccountsListQuerySchema = z.object({
  active: z.enum(["all", "true", "false"]).optional(),
  q: z.string().trim().optional(),
  type: PaymentAccountTypeSchema.optional(),
});

export type CreatePaymentAccountDTO = z.infer<typeof CreatePaymentAccountSchema>;
export type UpdatePaymentAccountDTO = z.infer<typeof UpdatePaymentAccountSchema>;
export type PaymentAccountsListQueryDTO = z.infer<
  typeof PaymentAccountsListQuerySchema
>;
