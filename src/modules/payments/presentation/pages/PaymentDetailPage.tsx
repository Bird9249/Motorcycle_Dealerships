import type { ReactNode } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/kit";
import { formatCurrencyAmount } from "@/modules/sales/presentation/lib/labels";
import { formatDateTimeLocal } from "@/shared/lib/date-time";
import { QueryState } from "@/shared/ui/QueryState";
import { usePaymentQuery } from "../api/queries";
import { PAYMENT_METHOD_LABELS } from "../lib/labels";
import { PaymentSlipPreview } from "../ui/PaymentSlipPreview";
import { PaymentStatusBadge } from "../ui/PaymentStatusBadge";
import { PaymentVerifyActions } from "../ui/PaymentVerifyActions";

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="col-span-2">{value}</div>
    </div>
  );
}

export function PaymentDetailPage() {
  const nav = useNavigate({ from: "/app/payments/$id" });
  const { id } = useParams({ from: "/app/payments/$id" });
  const { data: payment, ...result } = usePaymentQuery(id);

  return (
    <>
      <Header />
      <Main>
        <QueryState
          result={result}
          isEmpty={!payment}
          emptyMessage="ບໍ່ພົບການຊຳລະ"
        >
          {payment ? (
            <>
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-2xl tracking-tight">
                    ລາຍລະອຽດການຊຳລະ
                  </h2>
                  <p className="font-mono text-muted-foreground text-sm">
                    {payment.paymentNumber}
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

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2">
                      <CardTitle className="text-base">ຂໍ້ມູນການຊຳລະ</CardTitle>
                      <PaymentStatusBadge status={payment.status} />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <InfoRow
                        label="ຈຳນວນ"
                        value={formatCurrencyAmount(
                          payment.amount,
                          payment.currency,
                        )}
                      />
                      <InfoRow
                        label="ວິທີ"
                        value={PAYMENT_METHOD_LABELS[payment.paymentMethod]}
                      />
                      <InfoRow
                        label="ບັນຊີ"
                        value={payment.paymentAccount.name}
                      />
                      <InfoRow
                        label="ວັນຊຳລະ"
                        value={formatDateTimeLocal(payment.paidAt)}
                      />
                      <InfoRow
                        label="ຜູ້ບັນທຶກ"
                        value={payment.recordedByUser?.name ?? "—"}
                      />
                      {payment.verifiedByUser ? (
                        <InfoRow
                          label={
                            payment.status === "rejected"
                              ? "ຜູ້ປະຕິເສດ"
                              : "ຜູ້ຢືນຢັນ"
                          }
                          value={payment.verifiedByUser.name}
                        />
                      ) : null}
                      {payment.slipVerifiedAt ? (
                        <InfoRow
                          label="ເວລາຢືນຢັນ/ປະຕິເສດ"
                          value={formatDateTimeLocal(payment.slipVerifiedAt)}
                        />
                      ) : null}
                      {payment.salesOrder ? (
                        <InfoRow
                          label="ຄຳສັ່ງຂາຍ"
                          value={
                            <Button
                              variant="link"
                              className="h-auto p-0"
                              onClick={() =>
                                nav({
                                  to: "/app/sales/$id",
                                  params: { id: payment.salesOrder!.id },
                                })
                              }
                            >
                              {payment.salesOrder.orderNumber} —{" "}
                              {payment.salesOrder.customerName}
                            </Button>
                          }
                        />
                      ) : null}
                      {payment.schedule ? (
                        <InfoRow
                          label="ງວດຜ່ອນ"
                          value={`ງວດ #${payment.schedule.installmentNumber} (${formatCurrencyAmount(payment.schedule.amount, payment.currency)})`}
                        />
                      ) : null}
                      {payment.notes ? (
                        <InfoRow label="ໝາຍເຫດ" value={payment.notes} />
                      ) : null}
                    </CardContent>
                  </Card>

                  <PaymentVerifyActions
                    paymentId={payment.id}
                    status={payment.status}
                  />
                </div>

                <PaymentSlipPreview
                  slipImageKey={payment.slipImageKey}
                  slipUrl={payment.slipUrl}
                  paymentMethod={payment.paymentMethod}
                />
              </div>
            </>
          ) : null}
        </QueryState>
      </Main>
    </>
  );
}
