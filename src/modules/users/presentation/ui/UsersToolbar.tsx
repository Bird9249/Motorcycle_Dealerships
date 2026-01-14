import { Button } from "@devhop/ui";
import { HelpCircleIcon, PlusIcon } from "lucide-react";

type UsersToolbarProps = {
  canManage: boolean;
  onCreate: () => void;
  onStartTour?: () => void;
};

export function UsersToolbar({
  canManage,
  onCreate,
  onStartTour,
}: UsersToolbarProps) {
  return (
    <div className="mb-2 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between space-y-2">
        <div className="flex items-center gap-2">
          <div className="">
            <h2 className="flex items-center font-bold text-2xl tracking-tight">
              ຜູ້ໃຊ້{" "}
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
            <p className="text-muted-foreground">ຈັດການຜູ້ໃຊ້ໃນລະບົບ.</p>
          </div>
          {/* {onStartTour && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onStartTour}
              title="ເລີ່ມທົດລອງການນຳທາງ"
            >
              <HelpCircleIcon className="h-4 w-4" />
            </Button>
          )} */}
        </div>
        {canManage && (
          <div
            className="flex items-center space-x-2"
            data-tourid="users-toolbar"
          >
            <Button onClick={onCreate}>
              <PlusIcon className="h-4 w-4" />
              ສ້າງຜູ້ໃຊ້
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
