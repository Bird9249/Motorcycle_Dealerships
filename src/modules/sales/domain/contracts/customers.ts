import { z } from "zod";
import { OffsetPageQuerySchema } from "@/shared/contracts/base";

export const CreateCustomerSchema = z.object({
  fullName: z.string().trim().min(1, "ຕ້ອງໃສ່ຊື່ລູກຄ້າ"),
  phone: z.string().trim().min(1, "ຕ້ອງໃສ່ເບີໂທ"),
  phoneSecondary: z.string().trim().optional().nullable(),
  village: z.string().trim().optional().nullable(),
  district: z.string().trim().optional().nullable(),
  province: z.string().trim().optional().nullable(),
  idCardNumber: z.string().trim().optional().nullable(),
  householdBookNumber: z.string().trim().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "ຕ້ອງມີຂໍ້ມູນຢ່າງໜ້ອຍໜຶ່ງຟິວສຳລັບອັບເດດ" },
);

export const CustomersListQuerySchema = OffsetPageQuerySchema.extend({
  q: z.string().trim().optional(),
});

export const CustomerSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  phone: z.string(),
  phoneSecondary: z.string().nullable(),
  village: z.string().nullable(),
  district: z.string().nullable(),
  province: z.string().nullable(),
  idCardNumber: z.string().nullable(),
  householdBookNumber: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type CreateCustomerDTO = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerDTO = z.infer<typeof UpdateCustomerSchema>;
export type CustomersListQueryDTO = z.infer<typeof CustomersListQuerySchema>;
export type CustomerDTO = z.infer<typeof CustomerSchema>;
