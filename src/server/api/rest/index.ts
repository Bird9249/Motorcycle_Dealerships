import { Elysia } from "elysia";
import { afterSalesModuleRoutes } from "@/modules/after-sales/api";
import { auditRoutes } from "@/modules/audit/api";
import { authRoutes } from "@/modules/auth/api";
import { inventoryRoutes } from "@/modules/inventory/api";
import { masterDataRoutes } from "@/modules/master-data/api";
import { paymentsModuleRoutes } from "@/modules/payments/api";
import { reportsModuleRoutes } from "@/modules/reports/api";
import { salesModuleRoutes } from "@/modules/sales/api";
import { rolesRoutes } from "@/modules/roles/api";
import { uploadRoutes } from "@/modules/upload/api";
import { usersRoutes } from "@/modules/users/api";

export function createRestRoutes() {
  return new Elysia()
    .use(authRoutes)
    .use(usersRoutes)
    .use(rolesRoutes)
    .use(auditRoutes)
    .use(uploadRoutes)
    .use(inventoryRoutes)
    .use(masterDataRoutes)
    .use(salesModuleRoutes)
    .use(paymentsModuleRoutes)
    .use(afterSalesModuleRoutes)
    .use(reportsModuleRoutes);
}
