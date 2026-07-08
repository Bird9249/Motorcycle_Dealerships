import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/kit";
import SignInForm from "../ui/SignInForm";

export function LoginPage() {
  return (
    <Card className="w-full border shadow-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="font-semibold text-xl tracking-tight">
          ເຂົ້າລະບົບ
        </CardTitle>
        <CardDescription>
          ເຂົ້າໃຊ້ລະບົບດ້ວຍບັນຊີພະນັກງານຂອງທ່ານ
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignInForm />
      </CardContent>
    </Card>
  );
}
