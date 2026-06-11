import { Compass } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  toast,
} from "@/components/kit";

const TOUR_STORAGE_KEYS = [
  "users-tour-completed",
  "user-form-tour-completed",
  "roles-tour-completed",
  "role-form-tour-completed",
];

export function OnboardingSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ການແນະນຳການໃຊ້ງານ</CardTitle>
        <CardDescription>
          ຣີເຊັດທົວແນະນຳ ເພື່ອໃຫ້ມັນສະແດງອີກຄັ້ງເມື່ອເຂົ້າແຕ່ລະໜ້າ.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">
            ການແນະນຳຈະປາກົດໃໝ່ໃນໜ້າຜູ້ໃຊ້, ບົດບາດ ແລະ ຟອມຕ່າງໆ.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              for (const key of TOUR_STORAGE_KEYS) {
                localStorage.removeItem(key);
              }
              toast.success("ຣີເຊັດການແນະນຳແລ້ວ");
            }}
          >
            <Compass />
            ຣີເຊັດທົວທັງໝົດ
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
