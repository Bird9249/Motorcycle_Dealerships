import {
  Button,
  FormCheckbox,
  FormInput,
  FormPassword,
  FormRoot,
  Loader,
  RHF,
  toast,
  zodResolver,
} from "@devhop/ui";
import { useNavigate } from "@tanstack/react-router";
import z from "zod";
import { authClient } from "../api/client";
import { useAuthState } from "../model/useAuthState";

const SignInFormSchema = z.object({
  email: z.string().email({ message: "ອີເມວບໍ່ຖືກຕ້ອງ" }),
  password: z.string().min(6, { message: "ລະຫັດຜ່ານຕ້ອງຢ່າງນ້ອຍ 8 ຕົວອັກສອນ" }),
  rememberMe: z.boolean().optional(),
});

type ISignInFormSchema = z.infer<typeof SignInFormSchema>;

export default function SignInForm() {
  const navigate = useNavigate({ from: "/" });
  const { isLoading } = useAuthState();

  const form = RHF.useForm({
    defaultValues: { email: "", password: "" },
    resolver: zodResolver(SignInFormSchema),
  });

  const handleSubmit = async (value: ISignInFormSchema) => {
    await authClient.signIn.email(
      { email: value.email, password: value.password },
      {
        onSuccess: () => {
          navigate({ to: "/app/dashboard" });
          toast.success("ເຂົ້າລະບົບສໍາເລັດ");
        },
        onError: (error) => {
          toast.error(error.error.message || error.error.statusText);
        },
      },
    );
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <FormRoot<ISignInFormSchema> methods={form} onSubmit={handleSubmit}>
      <FormInput
        name="email"
        label="ອີເມວ"
        requiredMark
        placeholder="name@example.com"
      />
      <FormPassword
        name="password"
        label="ລະຫັດຜ່ານ"
        requiredMark
        placeholder="********"
      />

      <FormCheckbox name="rememberMe" label="ຈໍາຂ້ອຍໄວ້" />

      <Button type="submit" isLoading={isLoading} className="w-full">
        ເຂົ້າລະບົບ
      </Button>
    </FormRoot>
  );
}
