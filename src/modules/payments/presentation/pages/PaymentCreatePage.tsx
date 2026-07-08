import { useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { useMemo } from "react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button } from "@/components/kit";
import {
  usePaymentScheduleQuery,
  useSalesOrderQuery,
} from "@/modules/sales/presentation/api/queries";
import { formatCurrencyAmount } from "@/modules/sales/presentation/lib/labels";
import { QueryState } from "@/shared/ui/QueryState";
import {
  useCreatePayment,
  usePaymentAccountsQuery,
  usePaymentsQuery,
} from "../api/queries";
import {
  buildPaymentCreatePayload,
  PaymentCreateForm,
} from "../ui/PaymentCreateForm";
import { PaymentLinkPicker } from "../ui/PaymentLinkPicker";

function parseMoney(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function PaymentCreatePage() {
  const nav = useNavigate({ from: "/app/payments/new" });
  const search = useSearch({ from: "/app/payments/new" }) as {
    salesOrderId?: string;
    paymentScheduleId?: string;
  };

  const salesOrderId = search.salesOrderId;
  const paymentScheduleId = search.paymentScheduleId;

  const orderQuery = useSalesOrderQuery(salesOrderId ?? "");
  const scheduleQuery = usePaymentScheduleQuery(
    salesOrderId ?? "",
    !!salesOrderId && !!paymentScheduleId,
  );
  const accountsQuery = usePaymentAccountsQuery({ active: "true" });
  const verifiedPaymentsQuery = usePaymentsQuery(
    {
      salesOrderId,
      status: "verified",
      limit: 100,
      offset: 0,
    },
    !!salesOrderId && !paymentScheduleId,
  );
  const createPayment = useCreatePayment();

  const order = orderQuery.data;
  const schedule = scheduleQuery.data?.schedules.find(
    (s) => s.id === paymentScheduleId,
  );

  const currency = (schedule?.currency ??
    order?.saleCurrency ??
    "LAK") as "LAK" | "THB" | "USD";

  const { dueAmount, linkLabel } = useMemo(() => {
    if (schedule && order) {
      const due = Math.max(
        0,
        parseMoney(schedule.amount) - parseMoney(schedule.paidAmount),
      );
      return {
        dueAmount: due,
        linkLabel: `${order.orderNumber} · ງວດ #${schedule.installmentNumber} (${formatCurrencyAmount(schedule.amount, currency)})`,
      };
    }
    if (order) {
      const verifiedTotal =
        verifiedPaymentsQuery.data?.data.reduce(
          (sum, p) => sum + parseMoney(p.amount),
          0,
        ) ?? 0;
      const due = Math.max(0, parseMoney(order.salePrice) - verifiedTotal);
      return {
        dueAmount: due,
        linkLabel: `${order.orderNumber} · ${order.customer.fullName}`,
      };
    }
    return { dueAmount: 0, linkLabel: "—" };
  }, [schedule, order, currency, verifiedPaymentsQuery.data?.data]);

  const loading =
    (!!salesOrderId && orderQuery.isLoading) ||
    (!!paymentScheduleId && scheduleQuery.isLoading) ||
    accountsQuery.isLoading;

  const missingLink = !salesOrderId && !paymentScheduleId;
  const invalidOrder = !!salesOrderId && !orderQuery.isLoading && !order;
  const invalidSchedule =
    !!paymentScheduleId && !scheduleQuery.isLoading && !schedule;

  return (
    <>
      <Header />
      <Main>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">ຮັບຊຳລະເງິນ</h2>
            <p className="text-muted-foreground text-sm">
              ບັນທຶກການຊຳລະ ແລະ ແນບສລິບ
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => nav({ to: "/app/payments" })}
          >
            <ArrowLeftIcon className="size-4" />
            ກັບ
          </Button>
        </div>

        {missingLink ? (
          <PaymentLinkPicker
            onContinue={({ salesOrderId: oid, paymentScheduleId: sid }) =>
              nav({
                search: {
                  salesOrderId: oid,
                  ...(sid ? { paymentScheduleId: sid } : {}),
                },
              })
            }
          />
        ) : invalidOrder || invalidSchedule ? (
          <p className="text-destructive text-sm">ບໍ່ພົບຂໍ້ມູນອ້າງອີງ</p>
        ) : loading ? (
          <p className="text-muted-foreground text-sm">ກຳລັງໂຫຼດ...</p>
        ) : order && dueAmount <= 0 ? (
          <p className="text-muted-foreground text-sm">
            ຍອດນີ້ຊຳລະຄົບແລ້ວ — ບໍ່ຕ້ອງບັນທຶກເພີ່ມ
          </p>
        ) : order ? (
          <QueryState result={accountsQuery} isEmpty={!accountsQuery.data?.length}>
            <PaymentCreateForm
              accounts={accountsQuery.data ?? []}
              currency={currency}
              dueAmount={dueAmount}
              linkLabel={linkLabel}
              defaultAmount={schedule?.amount}
              submitting={createPayment.isPending}
              buildPayload={(values, account) =>
                buildPaymentCreatePayload(
                  {
                    salesOrderId: order.id,
                    paymentScheduleId: paymentScheduleId ?? null,
                  },
                  values,
                  account,
                )
              }
              onSubmit={(input) =>
                createPayment.mutate(input, {
                  onSuccess: (created) =>
                    nav({
                      to: "/app/payments/$id",
                      params: { id: created.id },
                    }),
                })
              }
            />
          </QueryState>
        ) : null}
      </Main>
    </>
  );
}
