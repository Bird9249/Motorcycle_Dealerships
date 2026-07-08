import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { lazy } from "react";
import { z } from "zod";
import { WarrantiesListQuerySchema } from "@/modules/after-sales/domain/contracts";
import { RequirePermissions } from "@/modules/auth/presentation/ui/RequirePermissions";
import { LazyPage } from "@/shared/ui/LazyPage";

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
  import("@/modules/roles/presentation/pages/RoleCreatePage").then(
    (module) => ({
      default: module.RoleCreatePage,
    }),
  ),
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
  import("@/modules/users/presentation/pages/UserCreatePage").then(
    (module) => ({
      default: module.UserCreatePage,
    }),
  ),
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
const SettingsPage = lazy(() =>
  import("@/modules/settings/presentation/pages/SettingsPage").then(
    (module) => ({
      default: module.SettingsPage,
    }),
  ),
);
const VehiclesPage = lazy(() =>
  import("@/modules/inventory/presentation/pages/VehiclesPage").then(
    (module) => ({
      default: module.VehiclesPage,
    }),
  ),
);
const VehicleCreatePage = lazy(() =>
  import("@/modules/inventory/presentation/pages/VehicleCreatePage").then(
    (module) => ({
      default: module.VehicleCreatePage,
    }),
  ),
);
const VehicleDetailPage = lazy(() =>
  import("@/modules/inventory/presentation/pages/VehicleDetailPage").then(
    (module) => ({
      default: module.VehicleDetailPage,
    }),
  ),
);
const VehicleEditPage = lazy(() =>
  import("@/modules/inventory/presentation/pages/VehicleEditPage").then(
    (module) => ({
      default: module.VehicleEditPage,
    }),
  ),
);
const MasterDataPage = lazy(() =>
  import("@/modules/master-data/presentation/pages/MasterDataPage").then(
    (module) => ({
      default: module.MasterDataPage,
    }),
  ),
);
const SalesPage = lazy(() =>
  import("@/modules/sales/presentation/pages/SalesPage").then((module) => ({
    default: module.SalesPage,
  })),
);
const SaleCreatePage = lazy(() =>
  import("@/modules/sales/presentation/pages/SaleCreatePage").then(
    (module) => ({
      default: module.SaleCreatePage,
    }),
  ),
);
const SaleDetailPage = lazy(() =>
  import("@/modules/sales/presentation/pages/SaleDetailPage").then(
    (module) => ({
      default: module.SaleDetailPage,
    }),
  ),
);
const SaleEditPage = lazy(() =>
  import("@/modules/sales/presentation/pages/SaleEditPage").then(
    (module) => ({
      default: module.SaleEditPage,
    }),
  ),
);
const PaymentSchedulePage = lazy(() =>
  import("@/modules/sales/presentation/pages/PaymentSchedulePage").then(
    (module) => ({
      default: module.PaymentSchedulePage,
    }),
  ),
);
const CustomersPage = lazy(() =>
  import("@/modules/sales/presentation/pages/CustomersPage").then(
    (module) => ({
      default: module.CustomersPage,
    }),
  ),
);
const CustomerDetailPage = lazy(() =>
  import("@/modules/sales/presentation/pages/CustomerDetailPage").then(
    (module) => ({
      default: module.CustomerDetailPage,
    }),
  ),
);
const PaymentsPage = lazy(() =>
  import("@/modules/payments/presentation/pages/PaymentsPage").then(
    (module) => ({
      default: module.PaymentsPage,
    }),
  ),
);
const PaymentDetailPage = lazy(() =>
  import("@/modules/payments/presentation/pages/PaymentDetailPage").then(
    (module) => ({
      default: module.PaymentDetailPage,
    }),
  ),
);
const PaymentCreatePage = lazy(() =>
  import("@/modules/payments/presentation/pages/PaymentCreatePage").then(
    (module) => ({
      default: module.PaymentCreatePage,
    }),
  ),
);
const ReconciliationPage = lazy(() =>
  import("@/modules/payments/presentation/pages/ReconciliationPage").then(
    (module) => ({
      default: module.ReconciliationPage,
    }),
  ),
);
const WarrantiesPage = lazy(() =>
  import("@/modules/after-sales/presentation/pages/WarrantiesPage").then(
    (module) => ({
      default: module.WarrantiesPage,
    }),
  ),
);
const WarrantyDetailPage = lazy(() =>
  import("@/modules/after-sales/presentation/pages/WarrantyDetailPage").then(
    (module) => ({
      default: module.WarrantyDetailPage,
    }),
  ),
);
const ServiceCheckInPage = lazy(() =>
  import("@/modules/after-sales/presentation/pages/ServiceCheckInPage").then(
    (module) => ({
      default: module.ServiceCheckInPage,
    }),
  ),
);
const Forbidden = lazy(() =>
  import("./error/Forbidden").then((module) => ({
    default: module.Forbidden,
  })),
);

const rootRoute = createRootRoute({
  component: RootLayout,
  errorComponent: ErrorBoundary,
  beforeLoad: ({ location }) => {
    if (
      location.pathname === "/" ||
      location.pathname === "/app" ||
      location.pathname === "/app/"
    ) {
      throw redirect({ to: "/app/dashboard", replace: true });
    }
  },
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

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/settings",
  component: () => (
    <LazyPage>
      <SettingsPage />
    </LazyPage>
  ),
});

const vehiclesInventoryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/inventory/vehicles",
  component: () => (
    <RequirePermissions all={["inventory:read"]}>
      <LazyPage>
        <VehiclesPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const vehicleCreateRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/inventory/vehicles/new",
  component: () => (
    <RequirePermissions all={["inventory:read"]} any={["inventory:create"]}>
      <LazyPage>
        <VehicleCreatePage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const vehicleDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/inventory/vehicles/$id",
  component: () => (
    <RequirePermissions all={["inventory:read"]}>
      <LazyPage>
        <VehicleDetailPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const vehicleEditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/inventory/vehicles/$id/edit",
  component: () => (
    <RequirePermissions all={["inventory:read"]} any={["inventory:update"]}>
      <LazyPage>
        <VehicleEditPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const masterDataSearchSchema = z.object({
  tab: z
    .enum(["brands", "models", "colors", "finance-companies"])
    .optional()
    .catch("brands"),
});

const masterDataRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/master-data",
  validateSearch: (search) => masterDataSearchSchema.parse(search),
  component: () => (
    <RequirePermissions all={["master-data:read"]}>
      <LazyPage>
        <MasterDataPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const salesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/sales",
  component: () => (
    <RequirePermissions all={["sales:read"]}>
      <LazyPage>
        <SalesPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const saleCreateRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/sales/new",
  component: () => (
    <RequirePermissions all={["sales:read"]} any={["sales:create"]}>
      <LazyPage>
        <SaleCreatePage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const saleDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/sales/$id",
  component: () => (
    <RequirePermissions all={["sales:read"]}>
      <LazyPage>
        <SaleDetailPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const saleEditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/sales/$id/edit",
  component: () => (
    <RequirePermissions all={["sales:read"]} any={["sales:update"]}>
      <LazyPage>
        <SaleEditPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const paymentScheduleRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/sales/$id/schedule",
  component: () => (
    <RequirePermissions all={["sales:read"]}>
      <LazyPage>
        <PaymentSchedulePage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const customersSearchSchema = z.object({
  offset: z.coerce.number().optional().catch(0),
  limit: z.coerce.number().optional().catch(20),
  q: z.string().optional(),
});

const customersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/customers",
  validateSearch: (search) => customersSearchSchema.parse(search),
  component: () => (
    <RequirePermissions all={["customers:read"]}>
      <LazyPage>
        <CustomersPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const customerDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/customers/$id",
  component: () => (
    <RequirePermissions all={["customers:read"]}>
      <LazyPage>
        <CustomerDetailPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const salesCustomersRedirectRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/sales/customers",
  validateSearch: (search) => customersSearchSchema.parse(search),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/app/customers",
      search,
    });
  },
  component: () => null,
});

const paymentsSearchSchema = z.object({
  offset: z.coerce.number().optional().catch(0),
  limit: z.coerce.number().optional().catch(20),
  status: z.enum(["pending", "verified", "rejected"]).optional(),
  paymentAccountId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sort: z
    .array(
      z.object({
        field: z.string(),
        dir: z.enum(["asc", "desc"]),
      }),
    )
    .optional(),
  filters: z
    .array(
      z.object({
        field: z.string(),
        op: z.string(),
        value: z.unknown(),
      }),
    )
    .optional(),
});

const paymentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/payments",
  validateSearch: (search) => paymentsSearchSchema.parse(search),
  component: () => (
    <RequirePermissions all={["payments:read"]}>
      <LazyPage>
        <PaymentsPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const paymentCreateSearchSchema = z.object({
  salesOrderId: z.string().optional(),
  paymentScheduleId: z.string().optional(),
});

const paymentCreateRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/payments/new",
  validateSearch: (search) => paymentCreateSearchSchema.parse(search),
  component: () => (
    <RequirePermissions all={["payments:read"]} any={["payments:create"]}>
      <LazyPage>
        <PaymentCreatePage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const paymentDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/payments/$id",
  component: () => (
    <RequirePermissions all={["payments:read"]}>
      <LazyPage>
        <PaymentDetailPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const reconciliationSearchSchema = z.object({
  date: z.string().optional(),
});

const reconciliationRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/payments/reconciliation",
  validateSearch: (search) => reconciliationSearchSchema.parse(search),
  component: () => (
    <RequirePermissions all={["payments:reconcile"]}>
      <LazyPage>
        <ReconciliationPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const warrantiesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/after-sales/warranties",
  validateSearch: (search) => WarrantiesListQuerySchema.parse(search),
  component: () => (
    <RequirePermissions all={["after-sales:read"]}>
      <LazyPage>
        <WarrantiesPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const warrantyDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/after-sales/warranties/$id",
  component: () => (
    <RequirePermissions all={["after-sales:read"]}>
      <LazyPage>
        <WarrantyDetailPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const serviceCheckInSearchSchema = z.object({
  vehicleId: z.string().optional(),
  customerId: z.string().optional(),
});

const serviceCheckInRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/after-sales/service",
  validateSearch: (search) => serviceCheckInSearchSchema.parse(search),
  component: () => (
    <RequirePermissions all={["after-sales:read"]}>
      <LazyPage>
        <ServiceCheckInPage />
      </LazyPage>
    </RequirePermissions>
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
    settingsRoute,
    vehiclesInventoryRoute,
    vehicleCreateRoute,
    vehicleDetailRoute,
    vehicleEditRoute,
    masterDataRoute,
    salesRoute,
    saleCreateRoute,
    saleDetailRoute,
    saleEditRoute,
    paymentScheduleRoute,
    customersRoute,
    customerDetailRoute,
    salesCustomersRedirectRoute,
    paymentsRoute,
    paymentCreateRoute,
    reconciliationRoute,
    paymentDetailRoute,
    warrantiesRoute,
    warrantyDetailRoute,
    serviceCheckInRoute,
  ]),
  forbiddenRoute,
]);
export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
