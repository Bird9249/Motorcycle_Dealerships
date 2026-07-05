import { z } from "zod";
import { OffsetPageQuerySchema } from "@/shared/contracts/base";
import {
  CurrencySchema,
  IdParamSchema,
  priceSchema,
  rateSchema,
  SalePaymentTypeSchema,
  SalesOrderStatusSchema,
} from "./common";

export { IdParamSchema };

export const CreateSalesOrderSchema = z.object({
  vehicleId: z.string().min(1, "ຕ້ອງເລືອກລົດ"),
  customerId: z.string().min(1, "ຕ້ອງເລືອກລູກຄ້າ"),
  salePrice: priceSchema,
  saleCurrency: CurrencySchema.default("LAK"),
  exchangeRateUsed: rateSchema.optional().nullable(),
  paymentType: SalePaymentTypeSchema,
  financeCompanyId: z.string().min(1).optional().nullable(),
  financeApprovedAmount: priceSchema.optional().nullable(),
  financeTransferReceived: z.boolean().optional(),
  financeTransferDate: z.iso.date().optional().nullable(),
  downPayment: priceSchema.optional().nullable(),
  downPaymentCurrency: CurrencySchema.optional().nullable(),
  installmentMonths: z.number().int().positive().optional().nullable(),
  interestRatePercent: rateSchema.optional().nullable(),
  monthlyInstallment: priceSchema.optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const UpdateSalesOrderSchema = CreateSalesOrderSchema.partial();

export const SalesOrdersListQuerySchema = OffsetPageQuerySchema.extend({
  status: SalesOrderStatusSchema.optional(),
  paymentType: SalePaymentTypeSchema.optional(),
  customerId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
  dateField: z.enum(["createdAt", "soldAt"]).optional(),
  dateFrom: z.iso.date().optional(),
  dateTo: z.iso.date().optional(),
});

export const SalesOrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  vehicleId: z.string(),
  customerId: z.string(),
  salespersonId: z.string(),
  salePrice: z.string(),
  saleCurrency: CurrencySchema,
  exchangeRateUsed: z.string().nullable(),
  paymentType: SalePaymentTypeSchema,
  status: SalesOrderStatusSchema,
  financeCompanyId: z.string().nullable(),
  financeApprovedAmount: z.string().nullable(),
  financeTransferReceived: z.boolean(),
  financeTransferDate: z.string().nullable(),
  downPayment: z.string().nullable(),
  downPaymentCurrency: CurrencySchema.nullable(),
  installmentMonths: z.number().nullable(),
  interestRatePercent: z.string().nullable(),
  monthlyInstallment: z.string().nullable(),
  notes: z.string().nullable(),
  soldAt: z.coerce.date().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type CreateSalesOrderDTO = z.infer<typeof CreateSalesOrderSchema>;
export type UpdateSalesOrderDTO = z.infer<typeof UpdateSalesOrderSchema>;
export type SalesOrdersListQueryDTO = z.infer<typeof SalesOrdersListQuerySchema>;
export type SalesOrderDTO = z.infer<typeof SalesOrderSchema>;
