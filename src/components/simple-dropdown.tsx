import { MoreHorizontal } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SimpleDropdownItem = {
  label: string;
  action?: () => void;
  icon?: React.ReactNode;
  variant?: "default" | "destructive";
  disabled?: boolean;
};

export type SimpleDropdownProps = {
  items: (SimpleDropdownItem | { type: "separator" })[];
  triggerLabel?: React.ReactNode;
  align?: React.ComponentProps<typeof DropdownMenuContent>["align"];
  side?: React.ComponentProps<typeof DropdownMenuContent>["side"];
  onSelect?: ((event: Event) => void) | undefined;
  className?: string;
};

export function SimpleDropdown({
  items,
  triggerLabel,
  align = "end",
  side,
  className,
  onSelect,
}: SimpleDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {triggerLabel ? (
          <Button variant="outline" size="sm" className={className}>
            {triggerLabel}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className={className}
            aria-label="More actions"
          >
            <MoreHorizontal />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side}>
        {items.map((item, index) => {
          if ("type" in item && item.type === "separator") {
            // biome-ignore lint/suspicious/noArrayIndexKey: separators are positional
            return <DropdownMenuSeparator key={`sep-${index}`} />;
          }
          const entry = item as SimpleDropdownItem;
          return (
            <DropdownMenuItem
              key={entry.label}
              variant={entry.variant}
              disabled={entry.disabled}
              onSelect={(event) => {
                onSelect?.(event);
                entry.action?.();
              }}
            >
              {entry.icon}
              {entry.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
