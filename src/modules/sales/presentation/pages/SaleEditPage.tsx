import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button } from "@/components/kit";
import { QueryState } from "@/shared/ui/QueryState";
import { useSalesOrderQuery } from "../api/queries";
import { SaleFormWizard } from "../ui/SaleFormWizard";

export function SaleEditPage() {
  const nav = useNavigate({ from: "/app/sales/$id/edit" });
  const { id } = useParams({ from: "/app/sales/$id/edit" });
  const { data: order, ...result } = useSalesOrderQuery(id);

  const isDraft = order?.status === "draft";

  return (
    <>
      <Header />
      <Main>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">ແກ້ໄຂຄຳສັ່ງຂາຍ</h2>
            <p className="text-muted-foreground text-sm">
              {order?.orderNumber ?? "—"} · ແກ້ໄຂ draft ກ່ອນຢືນຢັນ
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => nav({ to: "/app/sales/$id", params: { id } })}
          >
            <ArrowLeftIcon className="size-4" />
            ກັບ
          </Button>
        </div>

        <QueryState result={result} isEmpty={!order}>
          {order && isDraft ? (
            <SaleFormWizard orderId={id} initialOrder={order} />
          ) : order && !isDraft ? (
            <p className="text-muted-foreground text-sm">
              ຄຳສັ່ງນີ້ບໍ່ແມ່ນ draft — ບໍ່ສາມາດແກ້ໄຂໄດ້
            </p>
          ) : null}
        </QueryState>
      </Main>
    </>
  );
}
