import {
  CheckCircle2Icon,
  CircleDashedIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { cn } from "@/components/kit";

type DocumentStatusBadgeProps = {
  importInvoiceReceived: boolean;
  technicalInspectionReceived: boolean;
  registrationReady: boolean;
};

type DocPillProps = {
  label: string;
  done: boolean;
};

function DocPill({ label, done }: DocPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] leading-none",
        done
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-border bg-muted/50 text-muted-foreground",
      )}
    >
      {done ? (
        <CheckCircle2Icon className="size-3 shrink-0" />
      ) : (
        <CircleDashedIcon className="size-3 shrink-0 opacity-60" />
      )}
      {label}
    </span>
  );
}

export function DocumentStatusBadge({
  importInvoiceReceived,
  technicalInspectionReceived,
  registrationReady,
}: DocumentStatusBadgeProps) {
  return (
    <div className="flex min-w-[200px] flex-col gap-1.5">
      <div className="flex flex-wrap gap-1">
        <DocPill label="ໃບເສຍພາສີ" done={importInvoiceReceived} />
        <DocPill label="ໃບກວດ" done={technicalInspectionReceived} />
      </div>
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-[11px]",
          registrationReady
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        <ShieldCheckIcon className="size-3 shrink-0" />
        {registrationReady ? "ພ້ອມທະບຽນ" : "ຍັງບໍ່ຄົບເອກະສານ"}
      </span>
    </div>
  );
}
