import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  confirm,
} from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import { formatDateTimeLocal } from "@/shared/lib/date-time";
import { QueryState } from "@/shared/ui/QueryState";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckIcon,
  PencilIcon,
  XIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  useCancelSalesOrder,
  useCompleteSalesOrder,
  useConfirmSalesOrder,
  useSalesOrderQuery,
  useUpdateFinanceTransfer,
} from "../api/queries";
import { formatCurrencyAmount } from "../lib/labels";
import { PriceConversionsDisplay } from "../ui/PriceConversionsDisplay";
import { PaymentTypeBadge, SalesStatusBadge } from "../ui/SalesStatusBadge";

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="col-span-2">{value}</div>
    </div>
  );
}

export function SaleDetailPage() {
  const nav = useNavigate({ from: "/app/sales/$id" });
  const { id } = useParams({ from: "/app/sales/$id" });
  const { data: order, ...result } = useSalesOrderQuery(id);

  const canConfirm = useActionPermission(["sales:confirm"]);
  const canCancel = useActionPermission(["sales:cancel"]);
  const canUpdate = useActionPermission(["sales:update"]);

  const confirmOrder = useConfirmSalesOrder();
  const completeOrder = useCompleteSalesOrder();
  const cancelOrder = useCancelSalesOrder();
  const updateTransfer = useUpdateFinanceTransfer(id);

  const isDraft = order?.status === "draft";
  const isConfirmed = order?.status === "confirmed";
  const isInHouse = order?.paymentType === "in_house_leasing";
  const isBankFinance = order?.paymentType === "bank_finance";

  return (
    <>
      <Header />
      <Main>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">
              ລາຍລະອຽດການຂາຍ
            </h2>
            <p className="text-muted-foreground text-sm">
              {order?.orderNumber ?? "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => nav({ to: "/app/sales" })}>
              <ArrowLeftIcon className="size-4" />
              ກັບ
            </Button>
            {isDraft && canUpdate ? (
              <Button
                variant="secondary"
                onClick={() =>
                  nav({ to: "/app/sales/$id/edit", params: { id } })
                }
              >
                <PencilIcon className="size-4" />
                ແກ້ໄຂ
              </Button>
            ) : null}
            {isInHouse && order?.status !== "draft" ? (
              <Button
                variant="secondary"
                onClick={() =>
                  nav({ to: "/app/sales/$id/schedule", params: { id } })
                }
              >
                <CalendarIcon className="size-4" />
                ຕາຕະລາງຜ່ອນ
              </Button>
            ) : null}
            {isDraft && canConfirm ? (
              <Button
                onClick={async () => {
                  const ok = await confirm({
                    title: "ຢືນຢັນການຂາຍ?",
                    description: "ລົດຈະຖືກປ່ຽນເປັນຂາຍແລ້ວ",
                    actionText: "ຢືນຢັນ",
                  });
                  if (ok) confirmOrder.mutate(id);
                }}
                disabled={confirmOrder.isPending}
              >
                <CheckIcon className="size-4" />
                ຢືນຢັນ
              </Button>
            ) : null}
            {isConfirmed && canConfirm ? (
              <Button
                onClick={async () => {
                  const ok = await confirm({
                    title: "ປິດການຂາຍ?",
                    description:
                      isBankFinance && !order.financeTransferReceived
                        ? "ຕ້ອງບັນທຶກຮັບເງິນຈາກໄຟແນນກ່ອນ"
                        : "ປ່ຽນສະຖານະເປັນສຳເລັດ",
                    actionText: "ສຳເລັດ",
                  });
                  if (ok) completeOrder.mutate(id);
                }}
                disabled={
                  completeOrder.isPending ||
                  (isBankFinance && !order?.financeTransferReceived)
                }
              >
                <CheckIcon className="size-4" />
                ປິດການຂາຍ
              </Button>
            ) : null}
            {isDraft && canCancel ? (
              <Button
                variant="destructive"
                onClick={async () => {
                  const ok = await confirm({
                    title: "ຍົກເລີກຄຳສັ່ງ?",
                    description: "ລົດຈະກັບສູ່ສະຖານະຄົງຄັງ",
                    actionText: "ຍົກເລີກ",
                    ActionProps: { variant: "destructive" },
                  });
                  if (ok) cancelOrder.mutate(id);
                }}
                disabled={cancelOrder.isPending}
              >
                <XIcon className="size-4" />
                ຍົກເລີກ
              </Button>
            ) : null}
          </div>
        </div>

        <QueryState result={result} isEmpty={!order}>
          {order ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    ຂໍ້ມູນການຂາຍ
                    <SalesStatusBadge status={order.status} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="ເລກທີ" value={order.orderNumber} />
                  <InfoRow
                    label="ປະເພດ"
                    value={<PaymentTypeBadge type={order.paymentType} />}
                  />
                  <InfoRow
                    label="ລາຄາ"
                    value={formatCurrencyAmount(
                      order.salePrice,
                      order.saleCurrency,
                    )}
                  />
                  <InfoRow
                    label="ລູກຄ້າ"
                    value={`${order.customer.fullName} (${order.customer.phone})`}
                  />
                  <InfoRow
                    label="ລົດ"
                    value={`${order.vehicle.brandName} ${order.vehicle.modelName} · ${order.vehicle.chassisNumber ?? "—"}`}
                  />
                  <InfoRow label="ພະນັກງານຂາຍ" value={order.salesperson.name} />
                  <InfoRow
                    label="ສ້າງເມື່ອ"
                    value={formatDateTimeLocal(order.createdAt)}
                  />
                  {order.soldAt ? (
                    <InfoRow
                      label="ຂາຍເມື່ອ"
                      value={formatDateTimeLocal(order.soldAt)}
                    />
                  ) : null}
                </CardContent>
              </Card>

              <div className="space-y-6">
                {order.priceConversions ? (
                  <PriceConversionsDisplay
                    conversions={order.priceConversions.conversions.map(
                      (c) => ({
                        currency: c.currency as "LAK" | "THB" | "USD",
                        amount: c.amount,
                        isPrimary: c.isPrimary,
                      }),
                    )}
                    exchangeRateUsed={order.priceConversions.exchangeRateUsed}
                    rateEffectiveDate={order.priceConversions.rateEffectiveDate}
                    saleCurrency={order.saleCurrency}
                  />
                ) : null}

                {isBankFinance ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">ໄຟແນນ</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <InfoRow
                        label="ບໍລິສັດ"
                        value={order.financeCompany?.name ?? "—"}
                      />
                      <InfoRow
                        label="ວົງເງິນອະນຸມັດ"
                        value={
                          order.financeApprovedAmount
                            ? formatCurrencyAmount(
                                order.financeApprovedAmount,
                                order.saleCurrency,
                              )
                            : "—"
                        }
                      />
                      <InfoRow
                        label="ຮັບເງິນຈາກໄຟແນນ"
                        value={
                          order.financeTransferReceived ? "ຮັບແລ້ວ" : "ຍັງບໍ່ຮັບ"
                        }
                      />
                      {canUpdate &&
                      order.status === "confirmed" &&
                      !order.financeTransferReceived ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            updateTransfer.mutate({
                              financeTransferReceived: true,
                              financeTransferDate: new Date()
                                .toISOString()
                                .slice(0, 10),
                            })
                          }
                          disabled={updateTransfer.isPending}
                        >
                          ບັນທຶກຮັບເງິນແລ້ວ
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                ) : null}

                {isInHouse ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">ຜ່ອນຮ້ານ</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <InfoRow
                        label="ເງິນດາວ"
                        value={
                          order.downPayment
                            ? formatCurrencyAmount(
                                order.downPayment,
                                order.downPaymentCurrency ?? order.saleCurrency,
                              )
                            : "—"
                        }
                      />
                      <InfoRow
                        label="ງວດ"
                        value={order.installmentMonths ?? "—"}
                      />
                      <InfoRow
                        label="ດອກເບີ້ຍ"
                        value={
                          order.interestRatePercent
                            ? `${order.interestRatePercent}%/ປີ`
                            : "—"
                        }
                      />
                      <InfoRow
                        label="ຄ່າງວດ"
                        value={
                          order.monthlyInstallment
                            ? formatCurrencyAmount(
                                order.monthlyInstallment,
                                order.saleCurrency,
                              )
                            : "—"
                        }
                      />
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </div>
          ) : null}
        </QueryState>
      </Main>
    </>
  );
}
