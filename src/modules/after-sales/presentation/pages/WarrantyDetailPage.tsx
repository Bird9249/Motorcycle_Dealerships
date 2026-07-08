import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/kit";
import { formatDateLocal } from "@/shared/lib/date-time";
import { QueryState } from "@/shared/ui/QueryState";
import { useWarrantyQuery } from "../api/queries";
import {
  WARRANTY_STATUS_LABELS,
  WARRANTY_TYPE_LABELS,
  warrantyExpiryTone,
} from "../lib/labels";

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="col-span-2">{value}</div>
    </div>
  );
}

export function WarrantyDetailPage() {
  const nav = useNavigate({ from: "/app/after-sales/warranties/$id" });
  const { id } = useParams({ from: "/app/after-sales/warranties/$id" });
  const { data: warranty, ...result } = useWarrantyQuery(id);

  const expiry = warranty ? warrantyExpiryTone(warranty.daysRemaining) : null;

  return (
    <>
      <Header />
      <Main>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">
              {warranty
                ? WARRANTY_TYPE_LABELS[warranty.warrantyType]
                : "ລາຍລະອຽດປະກັນ"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {warranty?.salesOrder.orderNumber ?? "—"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => nav({ to: "/app/after-sales/warranties" })}
          >
            <ArrowLeftIcon className="size-4" />
            ກັບ
          </Button>
        </div>

        <QueryState result={result} isEmpty={!warranty}>
          {warranty && expiry ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="text-base">ຂໍ້ມູນປະກັນ</CardTitle>
                  <Badge variant={expiry.variant}>{expiry.label}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow
                    label="ປະເພດ"
                    value={WARRANTY_TYPE_LABELS[warranty.warrantyType]}
                  />
                  <InfoRow
                    label="ສະຖານະ"
                    value={
                      <Badge variant="outline">
                        {WARRANTY_STATUS_LABELS[warranty.status]}
                      </Badge>
                    }
                  />
                  <InfoRow
                    label="ເລີ່ມ"
                    value={formatDateLocal(warranty.startDate)}
                  />
                  <InfoRow
                    label="ໝົດອາຍຸ"
                    value={formatDateLocal(warranty.endDate)}
                  />
                  <InfoRow
                    label="ໄລຍະ"
                    value={`${warranty.durationMonths} ເດືອນ`}
                  />
                  {warranty.batterySerialNumber ? (
                    <InfoRow
                      label="ເລກແບດ"
                      value={warranty.batterySerialNumber}
                    />
                  ) : null}
                  <InfoRow label="ໝາຍເຫດ" value={warranty.notes ?? "—"} />
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">ລູກຄ້າ</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoRow
                      label="ຊື່"
                      value={warranty.customer.fullName}
                    />
                    <InfoRow label="ໂທ" value={warranty.customer.phone} />
                    <Button
                      variant="link"
                      className="h-auto p-0"
                      onClick={() =>
                        nav({
                          to: "/app/customers/$id",
                          params: { id: warranty.customerId },
                        })
                      }
                    >
                      ເບິ່ງລູກຄ້າ
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">ລົດ / ການຂາຍ</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoRow
                      label="ລົດ"
                      value={`${warranty.vehicle.brandName} ${warranty.vehicle.modelName}`}
                    />
                    <InfoRow
                      label="ຊາສີ"
                      value={warranty.vehicle.chassisNumber ?? "—"}
                    />
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          nav({
                            to: "/app/inventory/vehicles/$id",
                            params: { id: warranty.vehicleId },
                          })
                        }
                      >
                        ເບິ່ງລົດ
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          nav({
                            to: "/app/sales/$id",
                            params: { id: warranty.salesOrderId },
                          })
                        }
                      >
                        ເບິ່ງການຂາຍ
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </QueryState>
      </Main>
    </>
  );
}
