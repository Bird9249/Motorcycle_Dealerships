import { useNavigate, useSearch } from "@tanstack/react-router";
import { WrenchIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
} from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import { useVehicleQuery } from "@/modules/inventory/presentation/api/queries";
import { useSalesOrdersQuery } from "@/modules/sales/presentation/api/queries";
import {
  useCreateServiceRecord,
  useVehicleServiceHistoryQuery,
} from "../api/queries";
import {
  buildServiceRecordPayload,
  ServiceRecordForm,
} from "../ui/ServiceRecordForm";
import { ServiceHistoryTable } from "../ui/ServiceHistoryTable";
import { SoldVehicleCombobox } from "../ui/SoldVehicleCombobox";

type ServiceCheckInSearch = {
  vehicleId?: string;
  customerId?: string;
};

export function ServiceCheckInPage() {
  const nav = useNavigate({ from: "/app/after-sales/service" });
  const search = useSearch({
    from: "/app/after-sales/service",
  }) as ServiceCheckInSearch;

  const canCreate = useActionPermission(["after-sales:create-service"]);

  const [vehicleId, setVehicleId] = useState(search.vehicleId ?? "");
  const [customerId, setCustomerId] = useState(search.customerId ?? "");

  const vehicleQuery = useVehicleQuery(vehicleId);
  const ordersQuery = useSalesOrdersQuery(
    { vehicleId, limit: 20, offset: 0 },
    !!vehicleId,
  );
  const historyQuery = useVehicleServiceHistoryQuery(vehicleId);
  const createRecord = useCreateServiceRecord();

  const vehicle = vehicleQuery.data;
  const isEv = vehicle?.model.vehicleType === "ev";

  const customerOptions = useMemo(() => {
    const orders = (ordersQuery.data?.data ?? []).filter(
      (o) => o.status === "confirmed" || o.status === "completed",
    );
    const seen = new Set<string>();
    return orders
      .filter((o) => {
        if (seen.has(o.customerId)) return false;
        seen.add(o.customerId);
        return true;
      })
      .map((o) => ({
        id: o.customerId,
        label: `${o.customer.fullName} · ${o.orderNumber}`,
      }));
  }, [ordersQuery.data?.data]);

  useEffect(() => {
    if (!vehicleId) {
      setCustomerId("");
      return;
    }
    if (customerId && customerOptions.some((c) => c.id === customerId)) return;
    if (customerOptions.length === 1) {
      setCustomerId(customerOptions[0]!.id);
    }
  }, [vehicleId, customerId, customerOptions]);

  useEffect(() => {
    if (vehicleId || customerId) {
      nav({
        search: {
          vehicleId: vehicleId || undefined,
          customerId: customerId || undefined,
        },
        replace: true,
      });
    }
  }, [vehicleId, customerId, nav]);

  const selectedCustomer = customerOptions.find((c) => c.id === customerId);

  return (
    <>
      <Header />
      <Main>
        <div className="mb-6">
          <h2 className="font-bold text-2xl tracking-tight">ເຂົ້າບໍລິການ</h2>
          <p className="text-muted-foreground text-sm">
            ບັນທຶກການບຳລຸງຮັກສາ ຫຼື ກວດສອບຫຼັງການຂາຍ
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <WrenchIcon className="size-4" />
                ບັນທຶກ check-in
              </CardTitle>
              <CardDescription>
                ເລືອກລົດທີ່ຂາຍແລ້ວ ແລະ ລູກຄ້າທີ່ກ່ຽວຂ້ອງ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label>ລົດ (ຂາຍແລ້ວ)</Label>
                <SoldVehicleCombobox
                  value={vehicleId}
                  onValueChange={(next) => {
                    setVehicleId(next);
                    setCustomerId("");
                  }}
                />
              </div>

              {vehicle ? (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <p className="font-medium">
                    {vehicle.brand.name} {vehicle.model.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {vehicle.chassisNumber ?? "—"} ·{" "}
                    {isEv ? "EV" : "ICE"}
                  </p>
                </div>
              ) : null}

              {vehicleId ? (
                <div className="flex flex-col gap-2">
                  <Label>ລູກຄ້າ</Label>
                  {customerOptions.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      ບໍ່ພົບຄຳສັ່ງຂາຍທີ່ຢືນຢັນແລ້ວສຳລັບລົດນີ້
                    </p>
                  ) : customerOptions.length === 1 ? (
                    <p className="text-sm">{selectedCustomer?.label}</p>
                  ) : (
                    <select
                      className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                    >
                      <option value="">ເລືອກລູກຄ້າ...</option>
                      {customerOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : null}

              {canCreate && vehicleId && customerId ? (
                <ServiceRecordForm
                  vehicleId={vehicleId}
                  customerId={customerId}
                  isEv={isEv}
                  submitting={createRecord.isPending}
                  onSubmit={(values) =>
                    createRecord.mutate(buildServiceRecordPayload(values), {
                      onSuccess: () => historyQuery.refetch(),
                    })
                  }
                />
              ) : !canCreate ? (
                <p className="text-muted-foreground text-sm">
                  ທ່ານບໍ່ມີສິດບັນທຶກເຂົ້າບໍລິການ
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">ປະຫວັດບໍລິການ</CardTitle>
              <CardDescription>
                {vehicleId
                  ? "ປະຫວັດຂອງລົດທີ່ເລືອກ"
                  : "ເລືອກລົດເພື່ອເບິ່ງປະຫວັດ"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vehicleId ? (
                <ServiceHistoryTable
                  data={historyQuery.data?.data ?? []}
                  isLoading={historyQuery.isLoading}
                  showCustomer
                />
              ) : (
                <p className="py-8 text-center text-muted-foreground text-sm">
                  ເລືອກລົດເພື່ອເບິ່ງປະຫວັດ
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  );
}
