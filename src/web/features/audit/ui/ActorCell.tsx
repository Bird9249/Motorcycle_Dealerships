import { Button, useCopyToClipboard } from "@devhop/ui";
import { Check, Copy } from "lucide-react";
import type { AuditItem } from "../api/client";

export const ActorCell = ({ item }: { item: AuditItem }) => {
  const [copy, isCopied] = useCopyToClipboard();

  const val = item.actorId ?? "";
  return (
    <div className="flex items-center gap-1">
      <span
        title={val}
        className="block max-w-[120px] truncate font-mono text-xs"
      >
        {val || "-"}
      </span>
      {val ? (
        <Button
          type="button"
          variant="ghost"
          title="ຄັດລອກ"
          className="size-6"
          onClick={() => copy(val)}
        >
          {isCopied ? (
            <Check className="size-3" />
          ) : (
            <Copy className="size-3" />
          )}
        </Button>
      ) : null}
    </div>
  );
};
