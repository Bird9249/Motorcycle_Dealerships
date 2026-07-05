import { BikeIcon, PlusIcon } from "lucide-react";
import { Badge, Button, cn } from "@/components/kit";

type VehiclesToolbarProps = {
  canCreate: boolean;
  totalCount?: number;
  isLoading?: boolean;
  onCreate: () => void;
};

export function VehiclesToolbar({
  canCreate,
  totalCount,
  isLoading,
  onCreate,
}: VehiclesToolbarProps) {
  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <BikeIcon className="size-6" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-2xl tracking-tight">ລາຍການລົດ</h2>
              {!isLoading && totalCount !== undefined ? (
                <Badge variant="secondary" className="tabular-nums">
                  {totalCount.toLocaleString()} ຄັນ
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 max-w-xl text-muted-foreground text-sm">
              ຈັດການສິນຄ້າຄົງຄັງລົດຈັກລາຍຄັນ — ຄົ້ນຫາ, ກອງຕາມສະຖານະ ແລະ ບັນທຶກລົດໃໝ່.
            </p>
          </div>
        </div>

        {canCreate ? (
          <div
            className="flex items-center gap-2"
            data-tourid="vehicles-toolbar"
          >
            <Button onClick={onCreate} className={cn("shadow-sm")}>
              <PlusIcon className="size-4" />
              ເພີ່ມລົດ
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
