import type * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"div">;

export function FormActions({ className, ...props }: Props) {
  return (
    <div className={cn("flex justify-end gap-2 pt-1", className)} {...props} />
  );
}
