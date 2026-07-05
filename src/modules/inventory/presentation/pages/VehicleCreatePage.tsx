import { useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button, toast } from "@/components/kit";
import { useCreateVehicle } from "../api/queries";
import { VehicleForm } from "../ui/VehicleForm";

function formatImportDate(value: Date | string | null | undefined) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

export function VehicleCreatePage() {
  const nav = useNavigate({ from: "/app/inventory/vehicles/new" });
  const createVehicle = useCreateVehicle();

  return (
    <>
      <Header />

      <Main>
        <div className="flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">ເພີ່ມລົດ</h2>
            <p className="text-muted-foreground">ບັນທຶກລົດໃໝ່ເຂົ້າສິນຄ້າຄົງຄັງ.</p>
          </div>

          <Button
            variant="outline"
            onClick={() => nav({ to: "/app/inventory/vehicles" })}
          >
            <ArrowLeftIcon className="size-4" />
            ກັບຄືນ
          </Button>
        </div>

        <div className="mt-6 max-w-4xl">
          <VehicleForm
            submitting={createVehicle.isPending}
            onSubmit={async (vals) => {
              try {
                await createVehicle.mutateAsync({
                  modelId: vals.modelId,
                  colorId: vals.colorId,
                  chassisNumber: vals.chassisNumber || undefined,
                  engineNumber: vals.engineNumber || undefined,
                  batterySerialNumber: vals.batterySerialNumber || undefined,
                  batteryCapacityKwh: vals.batteryCapacityKwh || undefined,
                  costPrice: vals.costPrice,
                  costCurrency: vals.costCurrency,
                  listPrice: vals.listPrice,
                  listCurrency: vals.listCurrency,
                  importInvoiceReceived: vals.importInvoiceReceived,
                  technicalInspectionReceived: vals.technicalInspectionReceived,
                  importDate: formatImportDate(vals.importDate),
                  notes: vals.notes ?? null,
                });
                toast.success("ເພີ່ມລົດສຳເລັດ");
                nav({ to: "/app/inventory/vehicles" });
              } catch {
                // handled by mutation
              }
            }}
          />
        </div>
      </Main>
    </>
  );
}
