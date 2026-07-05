import { useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button } from "@/components/kit";
import { SaleFormWizard } from "../ui/SaleFormWizard";

export function SaleCreatePage() {
  const nav = useNavigate({ from: "/app/sales/new" });

  return (
    <>
      <Header />
      <Main>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">ສ້າງການຂາຍ</h2>
            <p className="text-muted-foreground text-sm">
              ຂັ້ນຕອນການຂາຍ: ເລືອກລົດ → ລູກຄ້າ → ລາຄາ → ປະເພດຊຳລະ → ຢືນຢັນ
            </p>
          </div>
          <Button variant="outline" onClick={() => nav({ to: "/app/sales" })}>
            <ArrowLeftIcon className="size-4" />
            ກັບ
          </Button>
        </div>
        <SaleFormWizard />
      </Main>
    </>
  );
}
