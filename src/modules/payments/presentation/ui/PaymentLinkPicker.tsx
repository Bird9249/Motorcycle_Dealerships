import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "@/components/kit";
import {
  usePaymentScheduleQuery,
  useSalesOrderQuery,
} from "@/modules/sales/presentation/api/queries";
import type { PaymentScheduleItem } from "@/modules/sales/presentation/api/client";
import {
  formatCurrencyAmount,
  PAYMENT_TYPE_LABELS,
  type SalePaymentType,
  SCHEDULE_STATUS_LABELS,
} from "@/modules/sales/presentation/lib/labels";
import { formatDateLocal } from "@/shared/lib/date-time";
import { SalesOrderCombobox } from "./SalesOrderCombobox";

type PaymentLinkPickerProps = {
  onContinue: (params: {
    salesOrderId: string;
    paymentScheduleId?: string;
  }) => void;
};

export function PaymentLinkPicker({ onContinue }: PaymentLinkPickerProps) {
  const [orderId, setOrderId] = useState("");
  const [scheduleId, setScheduleId] = useState("none");

  const orderQuery = useSalesOrderQuery(orderId);
  const selectedOrder = orderQuery.data;
  const isLeasing = selectedOrder?.paymentType === "in_house_leasing";

  const scheduleQuery = usePaymentScheduleQuery(orderId, isLeasing);
  const payableSchedules = useMemo(
    () =>
      (scheduleQuery.data?.schedules ?? []).filter(
        (s: PaymentScheduleItem) =>
          s.status === "pending" || s.status === "overdue",
      ),
    [scheduleQuery.data?.schedules],
  );

  const handleOrderChange = (next: string) => {
    setOrderId(next);
    setScheduleId("none");
  };

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="text-base">ເລືອກຄຳສັ່ງຂາຍ</CardTitle>
        <CardDescription>
          ຄົ້ນຫາດ້ວຍເລກທີຄຳສັ່ງ ຫຼື ເລືອກຈາກລາຍການທີ່ຢືນຢັນແລ້ວ
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="payment-order-combobox">ຄຳສັ່ງຂາຍ</Label>
          <SalesOrderCombobox
            value={orderId}
            onValueChange={handleOrderChange}
          />
        </div>

        {selectedOrder ? (
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{selectedOrder.orderNumber}</span>
              <Badge variant="secondary">
                {PAYMENT_TYPE_LABELS[selectedOrder.paymentType as SalePaymentType]}
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground">
              {selectedOrder.customer.fullName} ·{" "}
              {formatCurrencyAmount(
                selectedOrder.salePrice,
                selectedOrder.saleCurrency,
              )}
            </p>
          </div>
        ) : null}

        {isLeasing ? (
          <>
            <Separator />
            <div className="flex flex-col gap-2">
              <Label htmlFor="payment-schedule">ງວດຜ່ອນ</Label>
              <Select
                value={scheduleId}
                onValueChange={setScheduleId}
                disabled={scheduleQuery.isLoading}
              >
                <SelectTrigger id="payment-schedule" className="w-full bg-background">
                  <SelectValue placeholder="ເລືອກງວດ (ຖ້າຊຳລະງວດ)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    ບໍ່ຜູກງວດ — ຊຳລະດາວ / ເງິນສົດ
                  </SelectItem>
                  {payableSchedules.map((row: PaymentScheduleItem) => (
                    <SelectItem key={row.id} value={row.id}>
                      <span className="flex flex-wrap items-center gap-2">
                        <span>
                          ງວດ #{row.installmentNumber} ·{" "}
                          {formatCurrencyAmount(
                            row.amount,
                            row.currency as "LAK" | "THB" | "USD",
                          )}{" "}
                          · {formatDateLocal(row.dueDate)}
                        </span>
                        {row.status === "overdue" ? (
                          <Badge variant="destructive" className="text-xs">
                            {SCHEDULE_STATUS_LABELS.overdue}
                          </Badge>
                        ) : null}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                ຖ້າຊຳລະງວດຜ່ອນ ໃຫ້ເລືອກງວດ — ຖ້າຊຳລະດາວ ໃຫ້ປ່ອຍ «ບໍ່ຜູກງວດ»
              </p>
            </div>
          </>
        ) : null}

        <Button
          className="w-full sm:w-auto"
          disabled={!orderId || orderQuery.isLoading}
          onClick={() =>
            onContinue({
              salesOrderId: orderId,
              paymentScheduleId:
                scheduleId !== "none" ? scheduleId : undefined,
            })
          }
        >
          ດຳເນີນຕໍ່
        </Button>
      </CardContent>
    </Card>
  );
}
