import { z } from "zod";
import {
  Button,
  FormActions,
  FormInput,
  FormRoot,
  FormTextarea,
  RHF,
  zodResolver,
} from "@/components/kit";
import { CreateCustomerSchema } from "@/modules/sales/domain/contracts";
import type { CustomerItem } from "../api/client";

const schema = CreateCustomerSchema;

export type CustomerFormValues = z.infer<typeof schema>;

type CustomerFormProps = {
  initialValues?: Partial<CustomerFormValues>;
  onSubmit: (values: CustomerFormValues) => void;
  submitting?: boolean;
};

export function CustomerForm({
  initialValues,
  onSubmit,
  submitting,
}: CustomerFormProps) {
  const methods = RHF.useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      phone: "",
      phoneSecondary: "",
      village: "",
      district: "",
      province: "",
      idCardNumber: "",
      householdBookNumber: "",
      notes: "",
      ...initialValues,
    },
  });

  return (
    <FormRoot<CustomerFormValues>
      methods={methods}
      onSubmit={(vals) =>
        onSubmit({
          fullName: vals.fullName.trim(),
          phone: vals.phone.trim(),
          phoneSecondary: vals.phoneSecondary?.trim() || null,
          village: vals.village?.trim() || null,
          district: vals.district?.trim() || null,
          province: vals.province?.trim() || null,
          idCardNumber: vals.idCardNumber?.trim() || null,
          householdBookNumber: vals.householdBookNumber?.trim() || null,
          notes: vals.notes?.trim() || null,
        })
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput name="fullName" label="ຊື່-ນາມສະກຸນ" requiredMark />
        <FormInput name="phone" label="ເບີໂທ" requiredMark />
        <FormInput name="phoneSecondary" label="ເບີສຳຮອງ" />
        <FormInput name="idCardNumber" label="ເລກບັດປະຊາຊົນ" />
        <FormInput name="householdBookNumber" label="ເລກສຳມະໂນຄົວ" />
        <FormInput name="village" label="ບ້ານ" />
        <FormInput name="district" label="ເມືອງ" />
        <FormInput name="province" label="ແຂວງ" />
      </div>
      <FormTextarea name="notes" label="ໝາຍເຫດ" rows={3} />
      <FormActions>
        <Button type="submit" isLoading={submitting}>
          ບັນທຶກ
        </Button>
      </FormActions>
    </FormRoot>
  );
}

export function customerToFormValues(
  customer: CustomerItem,
): CustomerFormValues {
  return {
    fullName: customer.fullName,
    phone: customer.phone,
    phoneSecondary: customer.phoneSecondary ?? "",
    village: customer.village ?? "",
    district: customer.district ?? "",
    province: customer.province ?? "",
    idCardNumber: customer.idCardNumber ?? "",
    householdBookNumber: customer.householdBookNumber ?? "",
    notes: customer.notes ?? "",
  };
}
