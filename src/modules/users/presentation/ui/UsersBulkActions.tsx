import { BanIcon, TrashIcon, XIcon } from "lucide-react";
import { Button } from "@/components/kit";

type UsersBulkActionsProps = {
  count: number;
  onClear: () => void;
  onDelete?: () => void;
  onBan?: () => void;
  onUnban?: () => void;
  isPending?: boolean;
};

export function UsersBulkActions({
  count,
  onClear,
  onDelete,
  onBan,
  onUnban,
  isPending,
}: UsersBulkActionsProps) {
  if (count === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
      <p className="font-medium text-sm">ເລືອກ {count} ລາຍການ</p>
      <Button variant="ghost" size="sm" onClick={onClear} disabled={isPending}>
        <XIcon className="size-4" />
        ຍົກເລີກ
      </Button>
      <div className="ms-auto flex flex-wrap items-center gap-2">
        {onUnban ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onUnban}
            disabled={isPending}
          >
            <BanIcon className="size-4" />
            ຍົກເລີກລະງັບ
          </Button>
        ) : null}
        {onBan ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onBan}
            disabled={isPending}
          >
            <BanIcon className="size-4" />
            ລະງັບ
          </Button>
        ) : null}
        {onDelete ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={isPending}
            isLoading={isPending}
          >
            <TrashIcon className="size-4" />
            ລຶບ
          </Button>
        ) : null}
      </div>
    </div>
  );
}
