import { Permissions } from "@/modules/roles/domain/contracts/permissions";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { IdParamSchema } from "@/modules/sales/domain/contracts";
import { Elysia } from "elysia";
import {
  buildAuditEvent,
  getAuditContextFromRequest,
} from "@/modules/audit/domain/http/helpers";
import { appendAudit } from "@/modules/audit/domain/services/append-audit";
import {
  CreateServiceRecordSchema,
  ExpiringWarrantiesQuerySchema,
  ServiceRecordsListQuerySchema,
  UpdateWarrantySettingsSchema,
  VehicleHistoryParamSchema,
  WarrantiesListQuerySchema,
} from "../contracts";
import {
  getVehicleServiceHistory,
  listServiceRecords,
} from "../repo/service-records";
import {
  getWarrantyById,
  listExpiringWarranties,
  listWarranties,
} from "../repo/warranties";
import {
  createServiceRecordService,
  getWarrantySettingsService,
  updateWarrantySettingsService,
} from "../service";
import { mapAfterSalesError } from "./map-error";

type AuditCtx = Parameters<typeof getAuditContextFromRequest>[1] & {
  request: Request;
};

function auditCtxFromRoute(ctx: Record<string, unknown>): AuditCtx {
  return ctx as AuditCtx;
}

export const afterSalesRoutes = new Elysia()
  .use(serverContext)
  .get(
    "/service-records",
    async ({ db, query }) => listServiceRecords(query, db),
    {
      beforeHandle: requirePermission(Permissions.afterSales.read),
      query: ServiceRecordsListQuerySchema,
    },
  )
  .post(
    "/service-records",
    async (ctx) => {
      const { db, body, status, actorId } = ctx;
      if (!actorId) {
        return status(401, { error: "UNAUTHORIZED", message: "Not authenticated" });
      }
      try {
        const created = await createServiceRecordService(db, {
          input: body,
          performedBy: actorId,
        });
        const auditCtx = getAuditContextFromRequest(
          ctx.request,
          auditCtxFromRoute(ctx),
        );
        await appendAudit(db, [
          buildAuditEvent(auditCtx, {
            action: "SERVICE.RECORD.CREATE",
            entityType: "service_record",
            entityId: created.id,
            after: created,
          }),
        ]);
        return created;
      } catch (error) {
        return mapAfterSalesError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.afterSales.createService),
      body: CreateServiceRecordSchema,
    },
  )
  .get(
    "/vehicles/:vehicleId/history",
    async ({ db, params }) => getVehicleServiceHistory(params.vehicleId, db),
    {
      beforeHandle: requirePermission(Permissions.afterSales.read),
      params: VehicleHistoryParamSchema,
    },
  )
  .get(
    "/warranties/expiring",
    async ({ db, query }) => listExpiringWarranties(query, db),
    {
      beforeHandle: requirePermission(Permissions.afterSales.read),
      query: ExpiringWarrantiesQuerySchema,
    },
  )
  .get(
    "/warranties",
    async ({ db, query }) => listWarranties(query, db),
    {
      beforeHandle: requirePermission(Permissions.afterSales.read),
      query: WarrantiesListQuerySchema,
    },
  )
  .get(
    "/warranties/:id",
    async ({ db, params, status }) => {
      const warranty = await getWarrantyById(params.id, db);
      if (!warranty) {
        return status(404, { error: "NOT_FOUND", message: "Warranty not found" });
      }
      return warranty;
    },
    {
      beforeHandle: requirePermission(Permissions.afterSales.read),
      params: IdParamSchema,
    },
  )
  .get(
    "/warranty-settings",
    async ({ db }) => getWarrantySettingsService(db),
    {
      beforeHandle: requirePermission(Permissions.afterSales.read),
    },
  )
  .put(
    "/warranty-settings",
    async (ctx) => {
      const { db, body, status } = ctx;
      try {
        const { before, updated } = await updateWarrantySettingsService(
          db,
          body,
        );
        const auditCtx = getAuditContextFromRequest(
          ctx.request,
          auditCtxFromRoute(ctx),
        );
        await appendAudit(db, [
          buildAuditEvent(auditCtx, {
            action: "WARRANTY_SETTINGS.UPDATE",
            entityType: "warranty_settings",
            entityId: updated.id,
            before,
            after: updated,
          }),
        ]);
        return updated;
      } catch (error) {
        return mapAfterSalesError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.afterSales.manageWarranty),
      body: UpdateWarrantySettingsSchema,
    },
  );
