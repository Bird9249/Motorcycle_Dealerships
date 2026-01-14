import { Button } from "@devhop/ui";
import { HelpCircleIcon, Upload } from "lucide-react";

type MediaToolbarProps = {
  onCreate: () => void;
  onRefresh?: () => void;
  onStartTour?: () => void;
};

export function MediaToolbar({
  onCreate,
  onRefresh,
  onStartTour,
}: MediaToolbarProps) {
  return (
    <div className="mb-2 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between space-y-2">
        <div>
          <h2 className="flex items-center font-bold text-2xl tracking-tight">
            ສື່{" "}
            {onStartTour && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onStartTour}
                className="ml-2 size-6"
                title="ເລີ່ມທົດລອງການນຳທາງ"
              >
                <HelpCircleIcon className="h-4 w-4" />
              </Button>
            )}
          </h2>
          <p className="text-muted-foreground">ຈັດການຟາຍສື່ (ຮູບພາບ, ເອກະສານ).</p>
        </div>
        <div
          className="flex items-center space-x-2"
          data-tourid="media-toolbar"
        >
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh}>
              ຟື້ນຟູ
            </Button>
          )}
          <Button onClick={onCreate}>
            <Upload className="size-4" />
            ອັບໂຫຼດ
          </Button>
        </div>
      </div>
    </div>
  );
}
