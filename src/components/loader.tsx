import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Loader({ className }: { className?: string }) {
  return (
    <div className="flex min-h-40 w-full items-center justify-center p-6">
      <Loader2
        className={cn("size-6 animate-spin text-muted-foreground", className)}
      />
    </div>
  );
}
