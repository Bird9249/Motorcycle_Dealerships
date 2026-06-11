import { type LinkProps, useNavigate } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/kit";
import { usePermissions } from "@/modules/auth/presentation/model/usePermissions";
import { sidebarData } from "./data/sidebar-data";

type SearchEntry = {
  group: string;
  title: string;
  to: LinkProps["to"];
  icon?: React.ElementType;
};

export function GlobalSearch() {
  const navigate = useNavigate();
  const { hasAny } = usePermissions();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const groups = useMemo(() => {
    return sidebarData.navGroups
      .filter((group) => hasAny(group.requiredPermissions))
      .map((group) => {
        const entries: SearchEntry[] = [];
        group.items.forEach((item) => {
          if (!hasAny(item.requiredPermissions)) return;
          if ("url" in item && item.url) {
            entries.push({
              group: group.title,
              title: item.title,
              to: item.url as LinkProps["to"],
              icon: item.icon,
            });
          } else if ("items" in item && item.items) {
            item.items.forEach((sub) => {
              if (!hasAny(sub.requiredPermissions)) return;
              entries.push({
                group: group.title,
                title: sub.title,
                to: sub.url as LinkProps["to"],
                icon: item.icon,
              });
            });
          }
        });
        return { title: group.title, entries };
      })
      .filter((group) => group.entries.length > 0);
  }, [hasAny]);

  const go = (to: LinkProps["to"]) => {
    setOpen(false);
    navigate({ to });
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="ຄົ້ນຫາ"
        className="bg-muted/40 sm:hidden"
      >
        <SearchIcon className="size-4" />
      </Button>

      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="relative hidden h-9 justify-start gap-2 bg-muted/40 px-3 font-normal text-muted-foreground text-sm sm:flex sm:w-56 md:w-64"
      >
        <SearchIcon className="size-4" />
        <span className="truncate">ຄົ້ນຫາ...</span>
        <CommandShortcut className="pointer-events-none ml-auto flex gap-1">
          <kbd className="rounded border bg-background px-1.5 font-medium font-mono text-[10px]">
            ⌘K
          </kbd>
        </CommandShortcut>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="ຄົ້ນຫາ"
        description="ຄົ້ນຫາໜ້າ ແລະ ໄປຫາໄດ້ໄວ"
      >
        <CommandInput placeholder="ພິມເພື່ອຄົ້ນຫາໜ້າ..." />
        <CommandList>
          <CommandEmpty>ບໍ່ພົບຜົນລັບ</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group.title} heading={group.title}>
              {group.entries.map((entry) => {
                const Icon = entry.icon;
                return (
                  <CommandItem
                    key={`${group.title}-${entry.title}`}
                    value={`${group.title} ${entry.title}`}
                    onSelect={() => go(entry.to)}
                  >
                    {Icon ? <Icon /> : null}
                    <span>{entry.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
