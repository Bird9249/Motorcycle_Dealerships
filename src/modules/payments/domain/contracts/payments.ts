import { z } from "zod";
import { OffsetPageQuerySchema } from "@/shared/contracts/base";
import { CurrencySchema, IdParamSchema } from "./payment-accounts";

export { IdParamSchema };

export const PaymentMethodSchema = z.enum(["cash", "bank_transfer"]);

export const PaymentStatusSchema = z.enum(["pending", "verified", "rejected"]);

export const priceSchema = z.union([
  z.string().regex(/^\d+(\.\d{1,2})?$/),
  z.number().positive(),
]);

export const CreatePaymentSchema = z
  .object({
    salesOrderId: z.string().min(1).optional().nullable(),
    paymentScheduleId: z.string().min(1).optional().nullable(),
    paymentAccountId: z.string().min(1, "ຕ້ອງເລືອກບັນຊີ"),
    amount: priceSchema,
    currency: CurrencySchema,
    paymentMethod: PaymentMethodSchema,
    paidAt: z.coerce.date(),
    slipImageKey: z.string().trim().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.salesOrderId && !data.paymentScheduleId) {
      ctx.addIssue({
        code: "custom",
        message: "ຕ້ອງຜູກຄຳສັ່ງຂາຍ ຫຼື ງວດຜ່ອນ",
        path: ["salesOrderId"],
      });
    }
    if (data.paymentMethod === "bank_transfer" && !data.slipImageKey?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "ຕ້ອງແນບສລິບສຳລັບໂອນທະນາຄານ",
        path: ["slipImageKey"],
      });
    }
  });

export const RejectPaymentSchema = z.object({
  reason: z.string().trim().min(1, "ຕ້ອງໃສ່ເຫດຜົນ"),
});

export const PaymentsListQuerySchema = OffsetPageQuerySchema.extend({
  status: PaymentStatusSchema.optional(),
  paymentAccountId: z.string().min(1).optional(),
  salesOrderId: z.string().min(1).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreatePaymentDTO = z.infer<typeof CreatePaymentSchema>;
export type RejectPaymentDTO = z.infer<typeof RejectPaymentSchema>;
export type PaymentsListQueryDTO = z.infer<typeof PaymentsListQuerySchema>;
