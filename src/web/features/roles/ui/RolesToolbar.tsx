import { Button } from "@devhop/ui";
import { PlusIcon } from "lucide-react";

type RolesToolbarProps = {
  onCreate: () => void;
};

export function RolesToolbar({ onCreate }: RolesToolbarProps) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
      <div>
        <h2 className="font-bold text-2xl tracking-tight">ບົດບາດ</h2>
        <p className="text-muted-foreground">ຈັດການບົດບາດແລະສິດທິຂອງຜູ້ໃຊ້ໃນລະບົບ.</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button onClick={onCreate}>
          <PlusIcon className="h-4 w-4" />
          ສ້າງບົດບາດ
        </Button>
      </div>
    </div>
  );
}
