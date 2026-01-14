import { RequirePermissions } from "@/modules/auth/presentation/ui/RequirePermissions";
import { LazyPage } from "@/shared/ui/LazyPage";
import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { lazy } from "react";

const RootLayout = lazy(() =>
  import("./layout/RootLayout").then((module) => ({
    default: module.RootLayout,
  })),
);
const ErrorBoundary = lazy(() =>
  import("./error/ErrorBoundary").then((module) => ({
    default: module.ErrorBoundary,
  })),
);
const AuthLayout = lazy(() =>
  import("./layout/AuthLayout").then((module) => ({
    default: module.AuthLayout,
  })),
);

const LoginPage = lazy(() =>
  import("@/modules/auth/presentation/pages/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);
const AuthenticatedLayout = lazy(() =>
  import("./layout/AuthenticatedLayout").then((module) => ({
    default: module.AuthenticatedLayout,
  })),
);
const DashboardPage = lazy(() =>
  import("@/modules/dashboard/presentation/pages/DashboardPage").then(
    (module) => ({
      default: module.DashboardPage,
    }),
  ),
);
const RolesPage = lazy(() =>
  import("@/modules/roles/presentation/pages/RolesPage").then((module) => ({
    default: module.RolesPage,
  })),
);
const RoleCreatePage = lazy(() =>
  import("@/modules/roles/presentation/pages/RoleCreatePage").then((module) => ({
    default: module.RoleCreatePage,
  })),
);
const RoleEditPage = lazy(() =>
  import("@/modules/roles/presentation/pages/RoleEditPage").then((module) => ({
    default: module.RoleEditPage,
  })),
);
const AuditPage = lazy(() =>
  import("@/modules/audit/presentation/pages/AuditPage").then((module) => ({
    default: module.AuditPage,
  })),
);
const AuditDetailPage = lazy(() =>
  import("@/modules/audit/presentation/pages/AuditDetailPage").then(
    (module) => ({
      default: module.AuditDetailPage,
    }),
  ),
);
const UsersPage = lazy(() =>
  import("@/modules/users/presentation/pages/UsersPage").then((module) => ({
    default: module.UsersPage,
  })),
);
const UserCreatePage = lazy(() =>
  import("@/modules/users/presentation/pages/UserCreatePage").then((module) => ({
    default: module.UserCreatePage,
  })),
);
const UserEditPage = lazy(() =>
  import("@/modules/users/presentation/pages/UserEditPage").then((module) => ({
    default: module.UserEditPage,
  })),
);
const ProfilePage = lazy(() =>
  import("@/modules/auth/presentation/pages/ProfilePage").then((module) => ({
    default: module.ProfilePage,
  })),
);
const Forbidden = lazy(() =>
  import("./error/Forbidden").then((module) => ({
    default: module.Forbidden,
  })),
);

const MediaPage = lazy(() =>
  import("@/modules/media/presentation/pages/MediaPage").then((module) => ({
    default: module.MediaPage,
  })),
);

const rootRoute = createRootRoute({
  component: RootLayout,
  errorComponent: ErrorBoundary,
});

const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth",
  component: AuthLayout,
});

const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/login",
  component: LoginPage,
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app",
  component: AuthenticatedLayout,
});

const mediaRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/media",
  component: () => (
    <LazyPage>
      <MediaPage />
    </LazyPage>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/dashboard",
  component: () => (
    <LazyPage>
      <DashboardPage />
    </LazyPage>
  ),
});

const rolesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/roles",
  component: () => (
    <RequirePermissions all={["users:read"]} any={["users:ban"]}>
      <LazyPage>
        <RolesPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const roleCreateRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/roles/create",
  component: () => (
    <RequirePermissions all={["users:read"]} any={["users:ban"]}>
      <LazyPage>
        <RoleCreatePage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const roleEditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/roles/$id/edit",
  component: () => (
    <RequirePermissions all={["users:read"]} any={["users:ban"]}>
      <LazyPage>
        <RoleEditPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const auditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/audit",
  component: () => (
    <RequirePermissions all={["audit:read"]}>
      <LazyPage>
        <AuditPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const auditDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/audit/$id",
  component: () => (
    <RequirePermissions all={["audit:read"]}>
      <LazyPage>
        <AuditDetailPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const usersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/users",
  component: () => (
    <RequirePermissions all={["users:read"]}>
      <LazyPage>
        <UsersPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const userCreateRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/users/create",
  component: () => (
    <RequirePermissions all={["users:read"]} any={["users:create"]}>
      <LazyPage>
        <UserCreatePage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const userEditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/users/$id/edit",
  component: () => (
    <RequirePermissions all={["users:read"]} any={["users:update"]}>
      <LazyPage>
        <UserEditPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const profileRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/profile",
  component: () => (
    <LazyPage>
      <ProfilePage />
    </LazyPage>
  ),
});

const forbiddenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/errors/forbidden",
  component: () => (
    <LazyPage>
      <Forbidden />
    </LazyPage>
  ),
});

export const routeTree = rootRoute.addChildren([
  authLayoutRoute.addChildren([loginRoute]),
  appRoute.addChildren([
    dashboardRoute,
    rolesRoute,
    roleCreateRoute,
    roleEditRoute,
    usersRoute,
    userCreateRoute,
    userEditRoute,
    auditRoute,
    auditDetailRoute,
    profileRoute,
    mediaRoute,
  ]),
  forbiddenRoute,
]);
export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
