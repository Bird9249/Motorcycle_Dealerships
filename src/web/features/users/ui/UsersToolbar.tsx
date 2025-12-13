import { Button } from "@devhop/ui";
import { PlusIcon } from "lucide-react";

type UsersToolbarProps = {
  canManage: boolean;
  onCreate: () => void;
};

export function UsersToolbar({ canManage, onCreate }: UsersToolbarProps) {
  return (
    <div className="mb-2 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between space-y-2">
        <div>
          <h2 className="font-bold text-2xl tracking-tight">ຜູ້ໃຊ້</h2>
          <p className="text-muted-foreground">ຈັດການຜູ້ໃຊ້ໃນລະບົບ.</p>
        </div>
        {canManage && (
          <div className="flex items-center space-x-2">
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
