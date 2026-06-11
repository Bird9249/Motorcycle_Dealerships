import {
  AlertTriangle,
  CircleHelp,
  LogIn,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

export type ConfirmTone = "default" | "destructive" | "info";

export type ConfirmOptions = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actionText?: string;
  cancelText?: string;
  /** Visual tone — defaults from `ActionProps.variant` when omitted. */
  tone?: ConfirmTone;
  ActionProps?: { variant?: ButtonVariant; className?: string };
  CancelProps?: { variant?: ButtonVariant; className?: string };
};

type ConfirmRequest = ConfirmOptions & {
  id: number;
  resolve: (value: boolean) => void;
};

type Listener = (request: ConfirmRequest | null) => void;

let listener: Listener | null = null;
let counter = 0;

const toneVisuals: Record<
  ConfirmTone,
  { icon: LucideIcon; mediaClassName: string }
> = {
  default: {
    icon: CircleHelp,
    mediaClassName: "bg-primary/10 text-primary",
  },
  destructive: {
    icon: AlertTriangle,
    mediaClassName: "bg-destructive/10 text-destructive",
  },
  info: {
    icon: LogIn,
    mediaClassName: "bg-primary/10 text-primary",
  },
};

function resolveTone(request: ConfirmRequest | null): ConfirmTone {
  if (request?.tone) return request.tone;
  if (request?.ActionProps?.variant === "destructive") return "destructive";
  return "default";
}

function resolveIcon(tone: ConfirmTone, actionText?: string) {
  if (tone === "destructive") return toneVisuals.destructive;
  if (
    tone === "info" ||
    actionText?.includes("ເຂົ້າລະບົບ") ||
    actionText?.toLowerCase().includes("login")
  ) {
    return toneVisuals.info;
  }
  if (
    actionText?.includes("ລຶບ") ||
    actionText?.toLowerCase().includes("delete")
  ) {
    return toneVisuals.destructive;
  }
  return toneVisuals.default;
}

/**
 * Imperatively open a confirmation dialog. Resolves to `true` when the user
 * confirms, `false` otherwise. Requires `<Confirmer />` mounted once.
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (!listener) {
      console.warn("<Confirmer /> is not mounted; confirm() resolves false.");
      resolve(false);
      return;
    }
    counter += 1;
    listener({ ...options, id: counter, resolve });
  });
}

export function Confirmer() {
  const [request, setRequest] = React.useState<ConfirmRequest | null>(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    listener = (req) => {
      if (req) {
        setRequest(req);
        setOpen(true);
      }
    };
    return () => {
      listener = null;
    };
  }, []);

  const finish = (value: boolean) => {
    request?.resolve(value);
    setOpen(false);
    window.setTimeout(() => setRequest(null), 200);
  };

  const tone = resolveTone(request);
  const { icon: Icon, mediaClassName } = resolveIcon(tone, request?.actionText);
  const actionVariant = request?.ActionProps?.variant ?? "default";
  const cancelVariant = request?.CancelProps?.variant ?? "outline";

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) finish(false);
      }}
    >
      <AlertDialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <AlertDialogHeader className="flex flex-row items-start gap-4 p-6 pb-5 text-left">
          <span
            aria-hidden
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-full [&>svg]:size-5",
              mediaClassName,
            )}
          >
            <Icon />
          </span>

          <div className="flex flex-col gap-1.5 pt-0.5">
            {request?.title ? (
              <AlertDialogTitle className="text-base leading-snug">
                {request.title}
              </AlertDialogTitle>
            ) : null}

            {request?.description ? (
              <AlertDialogDescription className="text-pretty leading-relaxed">
                {request.description}
              </AlertDialogDescription>
            ) : null}
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 border-t bg-muted/30 px-6 py-4 sm:justify-end">
          <AlertDialogCancel
            variant={cancelVariant}
            className={cn("sm:min-w-24", request?.CancelProps?.className)}
            onClick={() => finish(false)}
          >
            {request?.cancelText ?? "ຍົກເລີກ"}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={actionVariant}
            className={cn("sm:min-w-24", request?.ActionProps?.className)}
            onClick={() => finish(true)}
          >
            {request?.actionText ?? "ຕົກລົງ"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
