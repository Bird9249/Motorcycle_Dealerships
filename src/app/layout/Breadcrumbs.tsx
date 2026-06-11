import { Link, type LinkProps, useRouterState } from "@tanstack/react-router";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  useIsMobile,
} from "@/components/kit";
import { HOME_ROUTE, type RouteMeta, routeMeta } from "./data/route-meta";

type Crumb = {
  label: string;
  to?: LinkProps["to"];
};

export function Breadcrumbs() {
  const isMobile = useIsMobile();
  const routeId = useRouterState({
    select: (s) => s.matches.at(-1)?.routeId ?? "",
  });

  const meta = routeMeta[routeId];
  if (!meta) return null;

  const chain: Array<{ id: string; label: string }> = [];
  let current: string | undefined = routeId;
  while (current !== undefined) {
    const entry: RouteMeta | undefined = routeMeta[current];
    if (!entry) break;
    chain.unshift({ id: current, label: entry.label });
    current = entry.parent;
  }

  const crumbs: Crumb[] = [];
  const home = routeMeta[HOME_ROUTE];
  if (routeId !== HOME_ROUTE && home) {
    crumbs.push({ label: home.label, to: HOME_ROUTE });
  }
  chain.forEach(({ id, label }, index) => {
    const isLast = index === chain.length - 1;
    crumbs.push({
      label,
      to: isLast ? undefined : (id as LinkProps["to"]),
    });
  });

  const first = crumbs[0];
  const last = crumbs[crumbs.length - 1];
  const middle = crumbs.slice(1, -1);

  // On small screens, collapse the middle crumbs behind an ellipsis menu.
  const collapse = isMobile && crumbs.length > 2 && !!first && !!last;

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {collapse ? (
          <>
            <BreadcrumbItem>
              {first.to ? (
                <BreadcrumbLink asChild>
                  <Link to={first.to}>{first.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{first.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {middle.length > 0 ? (
              <>
                <BreadcrumbItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="flex items-center gap-1"
                      aria-label="ສະແດງເສັ້ນທາງເພີ່ມເຕີມ"
                    >
                      <BreadcrumbEllipsis />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {middle.map((crumb) => (
                        <DropdownMenuItem key={crumb.label} asChild>
                          {crumb.to ? (
                            <Link to={crumb.to}>{crumb.label}</Link>
                          ) : (
                            <span>{crumb.label}</span>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            ) : null}
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="max-w-[45vw] truncate">
                {last.label}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <Fragment key={`${crumb.label}-${index}`}>
                <BreadcrumbItem className={isLast ? "min-w-0" : undefined}>
                  {isLast || !crumb.to ? (
                    <BreadcrumbPage className="max-w-[50vw] truncate sm:max-w-none">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.to}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {isLast ? null : <BreadcrumbSeparator />}
              </Fragment>
            );
          })
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
