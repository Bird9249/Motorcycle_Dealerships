import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@devhop/ui";
import SignInForm from "../ui/SignInForm";

export function LoginPage() {
  return (
    <Card className="w-full gap-4">
      <CardHeader>
        <CardTitle className="text-lg tracking-tight">ເຂົ້າລະບົບ</CardTitle>
        <CardDescription>
          ໃສ່ອີເມວ ແລະ ລະຫັດຜ່ານຂ້າງລຸ່ມນີ້ <br />
          ເພື່ອເຂົ້າໃຊ້ບັນຊີຂອງທ່ານ
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignInForm />
      </CardContent>
      {/* <CardFooter>
        <p className="px-8 text-center text-muted-foreground text-sm">
          By clicking sign in, you agree to our{" "}
          <a
            href="/terms"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </a>
          .
        </p>
      </CardFooter> */}
    </Card>
  );
}
