import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/kit";
import { QueryState } from "@/shared/ui/QueryState";
import {
  usePaymentScheduleQuery,
  useSalesOrderQuery,
} from "../api/queries";
import { formatCurrencyAmount } from "../lib/labels";
import { PaymentScheduleTable } from "../ui/PaymentScheduleTable";

export function PaymentSchedulePage() {
  const nav = useNavigate({ from: "/app/sales/$id/schedule" });
  const { id } = useParams({ from: "/app/sales/$id/schedule" });
  const orderQuery = useSalesOrderQuery(id);
  const scheduleQuery = usePaymentScheduleQuery(
    id,
    orderQuery.data?.paymentType === "in_house_leasing",
  );

  const order = orderQuery.data;

  return (
    <>
      <Header />
      <Main>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">ຕາຕະລາງຜ່ອນຊຳລະ</h2>
            <p className="text-muted-foreground text-sm">
              {order?.orderNumber ?? "—"}
              {order?.monthlyInstallment
                ? ` · ${formatCurrencyAmount(order.monthlyInstallment, order.saleCurrency)}/ເດືອນ`
                : ""}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => nav({ to: "/app/sales/$id", params: { id } })}
          >
            <ArrowLeftIcon className="size-4" />
            ກັບລາຍລະອຽດ
          </Button>
        </div>

        <QueryState result={scheduleQuery}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {scheduleQuery.data?.schedules.length ?? 0} ງວດ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentScheduleTable
                data={scheduleQuery.data?.schedules ?? []}
                isLoading={scheduleQuery.isLoading}
              />
            </CardContent>
          </Card>
        </QueryState>
      </Main>
    </>
  );
}
