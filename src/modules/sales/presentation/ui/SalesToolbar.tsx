import { Badge, Button } from "@/components/kit";
import { PlusIcon, ReceiptIcon } from "lucide-react";

type SalesToolbarProps = {
  canCreate: boolean;
  totalCount?: number;
  isLoading?: boolean;
  onCreate: () => void;
};

export function SalesToolbar({
  canCreate,
  totalCount,
  isLoading,
  onCreate,
}: SalesToolbarProps) {
  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <ReceiptIcon className="size-6" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-2xl tracking-tight">ການຂາຍ</h2>
              {!isLoading && totalCount !== undefined ? (
                <Badge variant="secondary" className="tabular-nums">
                  {totalCount.toLocaleString()} ລາຍການ
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 max-w-xl text-muted-foreground text-sm">
              ຈັດການຄຳສັ່ງຂາຍ — ຊື້ສົດ, ໄຟແນນ ແລະ ຜ່ອນຮ້ານ.
            </p>
          </div>
        </div>

        {canCreate ? (
          <Button onClick={onCreate}>
            <PlusIcon className="size-4" />
            ສ້າງການຂາຍ
          </Button>
        ) : null}
      </div>
    </div>
  );
}
