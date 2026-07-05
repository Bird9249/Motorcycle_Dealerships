import type { ReactNode } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  EditIcon,
  FuelIcon,
  ZapIcon,
} from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
} from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import { formatDateLocal, formatDateTimeLocal } from "@/shared/lib/date-time";
import { QueryState } from "@/shared/ui/QueryState";
import { useVehicleQuery } from "../api/queries";
import { VEHICLE_TYPE_LABELS } from "../lib/labels";
import { BatteryInfoSection } from "../ui/BatteryInfoSection";
import { DocumentStatusBadge } from "../ui/DocumentStatusBadge";
import { VehicleDocumentsPanel } from "../ui/VehicleDocumentsPanel";
import { VehicleStatusChange } from "../ui/VehicleStatusChange";
import { VehicleStatusTimeline } from "../ui/VehicleStatusTimeline";

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div
        className={cn(
          "col-span-2 break-all",
          mono && "font-mono text-xs tracking-tight",
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function VehicleDetailPage() {
  const nav = useNavigate({ from: "/app/inventory/vehicles/$id" });
  const { id } = useParams({ from: "/app/inventory/vehicles/$id" });
  const { data, ...result } = useVehicleQuery(id);
  const canUpdate = useActionPermission(["inventory:update"]);

  const vehicle = data;
  const locked =
    vehicle?.status === "sold" || vehicle?.status === "reserved";
  const isEv = vehicle?.model.vehicleType === "ev";
  const TypeIcon = isEv ? ZapIcon : FuelIcon;

  return (
    <>
      <Header />

      <Main>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">ລາຍລະອຽດລົດ</h2>
            <p className="text-muted-foreground text-sm">
              ຂໍ້ມູນລົດລາຍຄັນ ແລະ ເອກະສານນຳເຂົ້າ
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => nav({ to: "/app/inventory/vehicles" })}
            >
              <ArrowLeftIcon className="size-4" />
              ກັບຄືນ
            </Button>
            {canUpdate && vehicle && !locked ? (
              <Button
                onClick={() =>
                  nav({
                    to: "/app/inventory/vehicles/$id/edit",
                    params: { id: vehicle.id },
                  })
                }
              >
                <EditIcon className="size-4" />
                ແກ້ໄຂ
              </Button>
            ) : null}
          </div>
        </div>

        <QueryState
          result={result}
          title="ກຳລັງໂຫຼດລົດ"
          description="ກຳລັງດຶງລາຍລະອຽດ"
          variant="fullscreen"
        >
          {!vehicle ? null : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">
                          {vehicle.brand.name} {vehicle.model.name}
                        </CardTitle>
                        <div className="mt-2 flex flex-wrap items-end gap-3">
                          <VehicleStatusChange
                            vehicleId={vehicle.id}
                            currentStatus={vehicle.status}
                          />
                          <Badge
                            variant="outline"
                            className={cn(
                              "gap-1",
                              isEv
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                : "",
                            )}
                          >
                            <TypeIcon className="size-3" />
                            {VEHICLE_TYPE_LABELS[vehicle.model.vehicleType]}
                          </Badge>
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground text-sm">
                            <span
                              className="size-3 rounded-full border shadow-sm"
                              style={{
                                backgroundColor:
                                  vehicle.color.hexCode ?? "var(--muted)",
                              }}
                            />
                            {vehicle.color.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <InfoRow
                      label="ເລກຖັງ"
                      value={vehicle.chassisNumber ?? "—"}
                      mono
                    />
                    {!isEv ? (
                      <InfoRow
                        label="ເລກຈັກ"
                        value={vehicle.engineNumber ?? "—"}
                        mono
                      />
                    ) : null}
                    <InfoRow
                      label="ລາຄາຕົ້ນທຶນ"
                      value={`${Number(vehicle.costPrice).toLocaleString()} ${vehicle.costCurrency}`}
                    />
                    <InfoRow
                      label="ລາຄາຂາຍ"
                      value={`${Number(vehicle.listPrice).toLocaleString()} ${vehicle.listCurrency}`}
                    />
                    <InfoRow
                      label="ວັນນຳເຂົ້າ"
                      value={
                        vehicle.importDate
                          ? formatDateLocal(vehicle.importDate)
                          : "—"
                      }
                    />
                    <InfoRow
                      label="ອັບເດດລ່າສຸດ"
                      value={formatDateTimeLocal(vehicle.updatedAt)}
                    />
                    {vehicle.notes ? (
                      <InfoRow label="ໝາຍເຫດ" value={vehicle.notes} />
                    ) : null}
                  </CardContent>
                </Card>

                <BatteryInfoSection vehicle={vehicle} />

                <VehicleStatusTimeline vehicleId={vehicle.id} />

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">ສະຖານະເອກະສານ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DocumentStatusBadge
                      importInvoiceReceived={vehicle.importInvoiceReceived}
                      technicalInspectionReceived={
                        vehicle.technicalInspectionReceived
                      }
                      registrationReady={vehicle.registrationReady}
                    />
                  </CardContent>
                </Card>
              </div>

              <VehicleDocumentsPanel
                vehicle={vehicle}
                canManage={!!canUpdate}
              />
            </div>
          )}
        </QueryState>
      </Main>
    </>
  );
}
