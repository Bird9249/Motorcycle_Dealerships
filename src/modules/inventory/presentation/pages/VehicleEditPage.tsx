import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button, toast } from "@/components/kit";
import { QueryState } from "@/shared/ui/QueryState";
import { useUpdateVehicle, useVehicleQuery } from "../api/queries";
import { VehicleForm } from "../ui/VehicleForm";

function formatImportDate(value: Date | string | null | undefined) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

export function VehicleEditPage() {
  const nav = useNavigate({ from: "/app/inventory/vehicles/$id/edit" });
  const { id } = useParams({ from: "/app/inventory/vehicles/$id/edit" });
  const { data, ...result } = useVehicleQuery(id);
  const updateVehicle = useUpdateVehicle(id);

  const vehicle = data;
  const locked = vehicle?.status === "sold" || vehicle?.status === "reserved";

  return (
    <>
      <Header />

      <Main>
        <div className="flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">ແກ້ໄຂລົດ</h2>
            <p className="text-muted-foreground">ປັບປຸງຂໍ້ມູນລົດລາຍຄັນ.</p>
          </div>

          <Button
            variant="outline"
            onClick={() => nav({ to: "/app/inventory/vehicles" })}
          >
            <ArrowLeftIcon className="size-4" />
            ກັບຄືນ
          </Button>
        </div>

        <QueryState
          result={result}
          title="ກຳລັງໂຫຼດລົດ"
          description="ກຳລັງດຶງລາຍລະອຽດ"
          variant="fullscreen"
        >
          {!vehicle ? null : (
            <div className="mt-6 max-w-4xl">
              <VehicleForm
                locked={locked}
                submitting={updateVehicle.isPending}
                initialValues={{
                  modelId: vehicle.modelId,
                  colorId: vehicle.colorId,
                  chassisNumber: vehicle.chassisNumber ?? "",
                  engineNumber: vehicle.engineNumber ?? "",
                  batterySerialNumber: vehicle.batterySerialNumber ?? "",
                  batteryCapacityKwh: vehicle.batteryCapacityKwh ?? "",
                  costPrice: vehicle.costPrice,
                  costCurrency: vehicle.costCurrency,
                  listPrice: vehicle.listPrice,
                  listCurrency: vehicle.listCurrency,
                  importInvoiceReceived: vehicle.importInvoiceReceived,
                  technicalInspectionReceived:
                    vehicle.technicalInspectionReceived,
                  importDate: vehicle.importDate
                    ? new Date(vehicle.importDate)
                    : null,
                  notes: vehicle.notes ?? "",
                }}
                onSubmit={async (vals) => {
                  if (locked) return;
                  try {
                    await updateVehicle.mutateAsync({
                      modelId: vals.modelId,
                      colorId: vals.colorId,
                      chassisNumber: vals.chassisNumber || undefined,
                      engineNumber: vals.engineNumber || undefined,
                      batterySerialNumber:
                        vals.batterySerialNumber || undefined,
                      batteryCapacityKwh: vals.batteryCapacityKwh || undefined,
                      costPrice: vals.costPrice,
                      costCurrency: vals.costCurrency,
                      listPrice: vals.listPrice,
                      listCurrency: vals.listCurrency,
                      importInvoiceReceived: vals.importInvoiceReceived,
                      technicalInspectionReceived:
                        vals.technicalInspectionReceived,
                      importDate: formatImportDate(vals.importDate),
                      notes: vals.notes ?? null,
                    });
                    toast.success("ແກ້ໄຂລົດສຳເລັດ");
                    nav({ to: "/app/inventory/vehicles" });
                  } catch {
                    // handled by mutation
                  }
                }}
              />
            </div>
          )}
        </QueryState>
      </Main>
    </>
  );
}
