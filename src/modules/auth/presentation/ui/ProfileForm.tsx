import { z } from "zod";
import {
  Button,
  FormActions,
  FormAvatarUpload,
  FormInput,
  FormPassword,
  FormRoot,
  RHF,
  zodResolver,
} from "@/components/kit";

const ProfileFormSchema = z
  .object({
    name: z.string().min(1, "ຕ້ອງໃສ່ຊື່"),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    image: z.string().optional().nullable(),
    imageFile: z.instanceof(File).optional().nullable(),
  })
  .refine((val) => !val.password || val.password.length >= 6, {
    message: "ລະຫັດຜ່ານຕ້ອງຢ່າງນ້ອຍ 6 ຕົວອັກສອນ",
    path: ["password"],
  })
  .refine(
    (val) =>
      !val.password ||
      (val.confirmPassword != null && val.confirmPassword.length > 0),
    { message: "ກະລຸນາໃສ່ຢືນຢັນລະຫັດຜ່ານ", path: ["confirmPassword"] },
  )
  .refine((val) => !val.password || val.password === val.confirmPassword, {
    message: "ລະຫັດຜ່ານບໍ່ກົງກັນ",
    path: ["confirmPassword"],
  });

export type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

export function ProfileForm({
  initialValues,
  onSubmit,
  submitting,
}: {
  initialValues?: Partial<ProfileFormValues>;
  onSubmit: (values: {
    name: string;
    password?: string;
    confirmPassword?: string;
    image?: string | null;
    imageFile?: File | null;
  }) => void;
  submitting?: boolean;
}) {
  const methods = RHF.useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      name: "",
      password: "",
      confirmPassword: "",
      image: undefined,
      imageFile: undefined,
      ...initialValues,
    },
  });

  return (
    <FormRoot<ProfileFormValues>
      methods={methods}
      onSubmit={(vals) =>
        onSubmit({
          name: vals.name,
          password: vals.password || undefined,
          confirmPassword: vals.confirmPassword || undefined,
          image: vals.image ?? undefined,
          imageFile: vals.imageFile ?? undefined,
        })
      }
    >
      <div data-tourid="form-avatar">
        <FormAvatarUpload hint="ເລືອກຮູບ ຈະອັບໂຫຼດເມື່ອກົດບັນທຶກ" />
      </div>
      <div data-tourid="form-name">
        <FormInput name="name" label="ຊື່" requiredMark placeholder="John Doe" />
      </div>
      <div data-tourid="form-password">
        <FormPassword
          name="password"
          label="ລະຫັດຜ່ານໃໝ່"
          placeholder="********"
        />
      </div>
      <div data-tourid="form-confirm-password">
        <FormPassword
          name="confirmPassword"
          label="ຢືນຢັນລະຫັດຜ່ານ"
          placeholder="********"
        />
      </div>

      <FormActions data-tourid="form-submit">
        <Button type="submit" isLoading={submitting}>
          ບັນທຶກການປ່ຽນແປງ
        </Button>
      </FormActions>
    </FormRoot>
  );
}
