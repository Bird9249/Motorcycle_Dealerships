import {
  Button,
  FormAvatarUpload,
  FormInput,
  FormPassword,
  FormRoot,
  RHF,
  zodResolver,
} from "@devhop/ui";
import { z } from "zod";

const ProfileFormSchema = z
  .object({
    name: z.string().min(1, "ຕ້ອງໃສ່ຊື່"),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    image: z.string().optional(),
    imageFile: z.instanceof(File).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.password) {
      if (val.password.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password must be at least 6 characters",
          path: ["password"],
        });
      }

      if (!val.confirmPassword || val.confirmPassword.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Confirm password is required",
          path: ["confirmPassword"],
        });
      } else if (val.confirmPassword !== val.password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passwords do not match",
          path: ["confirmPassword"],
        });
      }
    }
  });

export type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

export function ProfileForm({
  initialValues,
  submitting,
  onSubmit,
}: {
  initialValues?: Partial<ProfileFormValues>;
  submitting?: boolean;
  onSubmit: (values: {
    name: string;
    password?: string;
    confirmPassword?: string;
    image?: string | null;
    imageFile?: File | null;
  }) => void;
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
          image: typeof vals.image === "string" ? vals.image : undefined,
          imageFile: vals.imageFile,
        })
      }
      className="space-y-4"
    >
      <div>
        <div className="mb-2 block text-sm">ຮູບໂປຣໄຟລ໌</div>
        <FormAvatarUpload
          name="image"
          fileFieldName="imageFile"
          onFileSelect={(file) => methods.setValue("imageFile", file ?? null)}
          hint="ອັບໂຫຼດຮູບໃໝ່"
          maxSizeBytes={1024 * 1024 * 5}
        />
      </div>

      <FormInput name="name" label="ຊື່" requiredMark placeholder="John Doe" />
      {/* Email is read-only display; we keep it out of the editable form */}
      <FormPassword name="password" label="ລະຫັດຜ່ານໃໝ່" placeholder="********" />
      <FormPassword
        name="confirmPassword"
        label="ຢືນຢັນລະຫັດຜ່ານ"
        placeholder="********"
      />

      <div className="flex justify-end gap-2">
        <Button type="submit" isLoading={submitting}>
          ບັນທຶກການປ່ຽນແປງ
        </Button>
      </div>
    </FormRoot>
  );
}
