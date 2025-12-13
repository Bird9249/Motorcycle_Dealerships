import type { RoleDTO } from "@/web/features/roles/api/client";
import { config } from "@/web/shared/lib/config";
import {
  fetchLookupForInfinite,
  hydrateLookupItem,
} from "@/web/shared/lib/utils";
import { FormInfiniteCombobox } from "@/web/shared/ui/FormInfiniteCombobox";
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

const UserFormSchema = z.object({
  email: z.string().email({ message: "ກະລຸນາໃສ່ອີເມວໃຫ້ຖືກຕ້ອງ" }),
  name: z.string().min(1, "ຕ້ອງໃສ່ຊື່"),
  password: z.string().min(6, "ລະຫັດຜ່ານຕ້ອງຢ່າງນ້ອຍ 6 ຕົວອັກສອນ").optional(),
  roleId: z.string().min(1, "ຕ້ອງເລືອກບົດບາດ").optional(),
  image: z.string().optional(),
  imageFile: z.instanceof(File).optional().nullable(),
});

export type UserFormValues = z.infer<typeof UserFormSchema>;

export function UserForm({
  initialValues,
  onSubmit,
  submitting,
}: {
  initialValues?: Partial<UserFormValues>;
  onSubmit: (values: {
    email: string;
    name: string;
    password?: string;
    roleId?: string;
    image?: string | null;
    imageFile?: File | null;
  }) => void;
  submitting?: boolean;
}) {
  const schema = initialValues
    ? UserFormSchema.omit({ password: true }).extend(
        z.object({ password: z.string().optional() }).shape,
      )
    : UserFormSchema;

  const methods = RHF.useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      roleId: "",
      image: undefined,
      imageFile: undefined,
      ...initialValues,
    },
  });

  return (
    <FormRoot<UserFormValues>
      methods={methods}
      onSubmit={(vals) =>
        onSubmit({
          email: vals.email,
          name: vals.name,
          password: vals.password || undefined,
          roleId: vals.roleId || undefined,
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
          onFileSelect={(file) => {
            methods.setValue("imageFile", file ?? null);
          }}
          hint="ອັບໂຫຼດຮູບໃໝ່"
          maxSizeBytes={1024 * 1024 * 5}
        />
      </div>
      <FormInput
        name="email"
        label="ອີເມວ"
        type="email"
        requiredMark
        placeholder="name@example.com"
      />
      <FormInput name="name" label="ຊື່" requiredMark placeholder="John Doe" />
      <FormPassword
        name="password"
        label="ລະຫັດຜ່ານ"
        placeholder="********"
        requiredMark={!initialValues}
      />
      <FormInfiniteCombobox<RoleDTO>
        name="roleId"
        label="ບົດບາດ"
        requiredMark
        queryKey={["roles"]}
        queryFn={(args) =>
          fetchLookupForInfinite(`${config.apiUrl}/rbac/roles/lookup`, args)
        }
        preloadQueryFn={(id) =>
          hydrateLookupItem(`${config.apiUrl}/rbac/roles/lookup`, id)
        }
        getLabel={(item) => item.name}
        getValue={(item) => item.id}
        placeholder="ເລືອກບົດບາດ..."
      />

      <div className="flex justify-end gap-2">
        <Button type="submit" isLoading={submitting}>
          ບັນທຶກ
        </Button>
      </div>
    </FormRoot>
  );
}
