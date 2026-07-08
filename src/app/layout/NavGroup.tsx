import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import {
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/kit";
import { usePermissions } from "@/modules/auth/presentation/model/usePermissions";
import type {
  NavCollapsible,
  NavGroup as NavGroupProps,
  NavItem,
  NavLink,
} from "./types";
import { useNavItemBadge } from "./useNavItemBadge";

function filterNavItems(
  items: NavItem[],
  hasAll: (required: NavItem["requiredPermissions"]) => boolean,
): NavItem[] {
  const result: NavItem[] = [];

  for (const item of items) {
    if (!hasAll(item.requiredPermissions ?? [])) continue;

    if ("items" in item && item.items) {
      const visibleSubs = item.items.filter((sub) =>
        hasAll(sub.requiredPermissions ?? []),
      );
      if (visibleSubs.length === 0) continue;
      result.push({ ...item, items: visibleSubs });
      continue;
    }

    result.push(item);
  }

  return result;
}

export function NavGroup({ title, items }: NavGroupProps) {
  const { state, isMobile } = useSidebar();
  const pathname = useLocation({ select: (location) => location.pathname });
  const { hasAll } = usePermissions();
  const visibleItems = filterNavItems(items, hasAll);
  if (visibleItems.length === 0) return null;
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {visibleItems.map((item) => {
          const key = `${item.title}-${"url" in item ? item.url : "group"}`;

          if (!item.items)
            return <SidebarMenuLink key={key} item={item} pathname={pathname} />;

          if (state === "collapsed" && !isMobile)
            return (
              <SidebarMenuCollapsedDropdown
                key={key}
                item={item}
                pathname={pathname}
              />
            );

          return (
            <SidebarMenuCollapsible key={key} item={item} pathname={pathname} />
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavBadge({ children }: { children: ReactNode }) {
  return <Badge className="rounded-full px-1 py-0 text-xs">{children}</Badge>;
}

function SubNavBadge({
  url,
  badge,
  inline,
}: {
  url: string;
  badge?: string;
  inline?: boolean;
}) {
  const dynamicBadge = useNavItemBadge(url);
  const value = badge ?? dynamicBadge;
  if (!value) return null;
  if (inline) {
    return <span className="ms-auto text-xs">{value}</span>;
  }
  return <NavBadge>{value}</NavBadge>;
}

function SidebarMenuLink({
  item,
  pathname,
}: {
  item: NavLink;
  pathname: string;
}) {
  const { setOpenMobile } = useSidebar();
  const dynamicBadge = useNavItemBadge(item.url);
  const badge = item.badge ?? dynamicBadge;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={checkIsActive(pathname, item)}
        tooltip={item.title}
      >
        <Link to={item.url} onClick={() => setOpenMobile(false)}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          {badge ? <NavBadge>{badge}</NavBadge> : null}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SidebarMenuCollapsible({
  item,
  pathname,
}: {
  item: NavCollapsible;
  pathname: string;
}) {
  const { setOpenMobile } = useSidebar();
  const { hasAll } = usePermissions();
  const visibleSubs = item.items.filter((sub) =>
    hasAll(sub.requiredPermissions ?? []),
  );
  return (
    <Collapsible
      asChild
      defaultOpen={checkIsActive(pathname, item, true)}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="CollapsibleContent">
          <SidebarMenuSub>
            {visibleSubs.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  asChild
                  isActive={checkIsActive(pathname, subItem)}
                >
                  <Link to={subItem.url} onClick={() => setOpenMobile(false)}>
                    {subItem.icon && <subItem.icon />}
                    <span>{subItem.title}</span>
                    <SubNavBadge url={subItem.url} badge={subItem.badge} />
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function SidebarMenuCollapsedDropdown({
  item,
  pathname,
}: {
  item: NavCollapsible;
  pathname: string;
}) {
  const { hasAll } = usePermissions();
  const visibleSubs = item.items.filter((sub) =>
    hasAll(sub.requiredPermissions ?? []),
  );
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={checkIsActive(pathname, item)}
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" sideOffset={4}>
          <DropdownMenuLabel>
            {item.title} {item.badge ? `(${item.badge})` : ""}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {visibleSubs.map((sub) => (
            <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
              <Link
                to={sub.url}
                className={`${checkIsActive(pathname, sub) ? "bg-secondary" : ""}`}
              >
                {sub.icon && <sub.icon />}
                <span className="max-w-52 text-wrap">{sub.title}</span>
                <SubNavBadge url={sub.url} badge={sub.badge} inline />
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function checkIsActive(pathname: string, item: NavItem, mainNav = false) {
  const path = pathname.split("?")[0];
  const itemPath =
    "url" in item && item.url ? String(item.url).split("?")[0] : undefined;

  const subActive = item.items?.some((sub) => {
    const subPath = String(sub.url).split("?")[0];
    return path === subPath || path.startsWith(`${subPath}/`);
  });

  return (
    path === itemPath ||
    (!!itemPath && path.startsWith(`${itemPath}/`)) ||
    !!subActive ||
    (mainNav && !!subActive)
  );
}
