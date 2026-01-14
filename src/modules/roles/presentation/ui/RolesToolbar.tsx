import { Button } from "@devhop/ui";
import { HelpCircleIcon, PlusIcon } from "lucide-react";

type RolesToolbarProps = {
  onCreate: () => void;
  onStartTour?: () => void;
};

export function RolesToolbar({ onCreate, onStartTour }: RolesToolbarProps) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
      <div>
        <h2 className="flex items-center font-bold text-2xl tracking-tight">
          ບົດບາດ{" "}
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
        <p className="text-muted-foreground">ຈັດການບົດບາດແລະສິດທິຂອງຜູ້ໃຊ້ໃນລະບົບ.</p>
      </div>
      <div className="flex items-center space-x-2" data-tourid="roles-toolbar">
        <Button onClick={onCreate}>
          <PlusIcon className="h-4 w-4" />
          ສ້າງບົດບາດ
        </Button>
      </div>
    </div>
  );
}
