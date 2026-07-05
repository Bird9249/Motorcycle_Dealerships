import { Elysia } from "elysia";
import {
  buildAuditEvent,
  getAuditContextFromRequest,
} from "@/modules/audit/domain/http/helpers";
import { appendAudit } from "@/modules/audit/domain/services/append-audit";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import {
  CreateVehicleDocumentSchema,
  CreateVehicleSchema,
  IdParamSchema,
  ModelsListQuerySchema,
  UpdateVehicleDocumentStatusSchema,
  UpdateVehicleSchema,
  UpdateVehicleStatusSchema,
  VehicleDocumentParamSchema,
  VehiclesListQuerySchema,
} from "../contracts";
import { listBrands } from "../repo/list-brands";
import { listColors } from "../repo/list-colors";
import { listModels } from "../repo/list-models";
import { getVehicleById, listVehicles } from "../repo/list-vehicles";
import { getVehicleStatusHistory } from "../repo/get-vehicle-status-history";
import {
  addVehicleDocumentService,
  createVehicleService,
  deleteVehicleDocumentService,
  deleteVehicleService,
  updateDocumentStatusService,
  updateVehicleService,
  updateVehicleStatusService,
} from "../service";
import { mapInventoryError } from "./map-error";

async function auditVehicleEvent(
  ctx: Parameters<typeof getAuditContextFromRequest>[1] & { request: Request },
  db: Parameters<typeof appendAudit>[0],
  params: {
    action: string;
    entityId?: string;
    before?: unknown;
    after?: unknown;
    result?: "success" | "failed";
    error?: string;
  },
) {
  const auditCtx = getAuditContextFromRequest(ctx.request, ctx);
  await appendAudit(db, [
    buildAuditEvent(auditCtx, {
      action: params.action,
      entityType: "vehicle",
      entityId: params.entityId,
      before: params.before,
      after: params.after,
      result: params.result,
      error: params.error,
    }),
  ]);
}

export const inventoryRoutes = new Elysia()
  .use(serverContext)
  .get("/brands", async ({ db }) => listBrands(db), {
    beforeHandle: requirePermission("inventory:read"),
  })
  .get("/colors", async ({ db }) => listColors(db), {
    beforeHandle: requirePermission("inventory:read"),
  })
  .get("/models", async ({ db, query }) => listModels(query, db), {
    beforeHandle: requirePermission("inventory:read"),
    query: ModelsListQuerySchema,
  })
  .get("/vehicles", async ({ db, query }) => listVehicles(query, db), {
    beforeHandle: requirePermission("inventory:read"),
    query: VehiclesListQuerySchema,
  })
  .get(
    "/vehicles/:id",
    async ({ db, params, status }) => {
      const vehicle = await getVehicleById(params.id, db);
      if (!vehicle) return status(404, { error: "NOT_FOUND" });
      return vehicle;
    },
    {
      beforeHandle: requirePermission("inventory:read"),
      params: IdParamSchema,
    },
  )
  .get(
    "/vehicles/:id/status-history",
    async ({ db, params, status }) => {
      const vehicle = await getVehicleById(params.id, db);
      if (!vehicle) return status(404, { error: "NOT_FOUND" });
      return getVehicleStatusHistory(params.id, db);
    },
    {
      beforeHandle: requirePermission("inventory:read"),
      params: IdParamSchema,
    },
  )
  .post(
    "/vehicles",
    async ({
      db,
      body,
      status,
      request,
      requestId,
      traceId,
      ip,
      userAgent,
      tenantId,
      actorId,
      actorRole,
      user,
    }) => {
      try {
        const { created } = await createVehicleService(db, {
          input: { ...body, createdBy: user?.id ?? null },
        });
        await auditVehicleEvent(
          {
            request,
            requestId,
            traceId,
            ip,
            userAgent,
            tenantId,
            actorId,
            actorRole,
          },
          db,
          {
            action: "INVENTORY.VEHICLE.CREATE",
            entityId: created.id,
            after: created,
          },
        );
        return status(201, created);
      } catch (error) {
        const mapped = mapInventoryError(error, status);
        if (error instanceof Error) {
          await auditVehicleEvent(
            {
              request,
              requestId,
              traceId,
              ip,
              userAgent,
              tenantId,
              actorId,
              actorRole,
            },
            db,
            {
              action: "INVENTORY.VEHICLE.CREATE",
              result: "failed",
              error: error.message.slice(0, 200),
            },
          ).catch(() => {});
        }
        return mapped;
      }
    },
    {
      beforeHandle: requirePermission("inventory:create"),
      body: CreateVehicleSchema,
    },
  )
  .put(
    "/vehicles/:id",
    async ({
      db,
      params,
      body,
      status,
      request,
      requestId,
      traceId,
      ip,
      userAgent,
      tenantId,
      actorId,
      actorRole,
    }) => {
      try {
        const { before, updated } = await updateVehicleService(db, {
          id: params.id,
          input: body,
        });
        await auditVehicleEvent(
          {
            request,
            requestId,
            traceId,
            ip,
            userAgent,
            tenantId,
            actorId,
            actorRole,
          },
          db,
          {
            action: "INVENTORY.VEHICLE.UPDATE",
            entityId: updated.id,
            before,
            after: updated,
          },
        );
        return updated;
      } catch (error) {
        const mapped = mapInventoryError(error, status);
        if (error instanceof Error) {
          await auditVehicleEvent(
            {
              request,
              requestId,
              traceId,
              ip,
              userAgent,
              tenantId,
              actorId,
              actorRole,
            },
            db,
            {
              action: "INVENTORY.VEHICLE.UPDATE",
              entityId: params.id,
              result: "failed",
              error: error.message.slice(0, 200),
            },
          ).catch(() => {});
        }
        return mapped;
      }
    },
    {
      beforeHandle: requirePermission("inventory:update"),
      params: IdParamSchema,
      body: UpdateVehicleSchema,
    },
  )
  .patch(
    "/vehicles/:id/status",
    async ({
      db,
      params,
      body,
      status,
      request,
      requestId,
      traceId,
      ip,
      userAgent,
      tenantId,
      actorId,
      actorRole,
    }) => {
      try {
        const { before, updated } = await updateVehicleStatusService(db, {
          id: params.id,
          input: body,
        });
        await auditVehicleEvent(
          {
            request,
            requestId,
            traceId,
            ip,
            userAgent,
            tenantId,
            actorId,
            actorRole,
          },
          db,
          {
            action: "INVENTORY.VEHICLE.STATUS_UPDATE",
            entityId: updated.id,
            before: { status: before.status },
            after: { status: updated.status },
          },
        );
        return updated;
      } catch (error) {
        const mapped = mapInventoryError(error, status);
        if (error instanceof Error) {
          await auditVehicleEvent(
            {
              request,
              requestId,
              traceId,
              ip,
              userAgent,
              tenantId,
              actorId,
              actorRole,
            },
            db,
            {
              action: "INVENTORY.VEHICLE.STATUS_UPDATE",
              entityId: params.id,
              result: "failed",
              error: error.message.slice(0, 200),
            },
          ).catch(() => {});
        }
        return mapped;
      }
    },
    {
      beforeHandle: requirePermission("inventory:update-status"),
      params: IdParamSchema,
      body: UpdateVehicleStatusSchema,
    },
  )
  .delete(
    "/vehicles/:id",
    async ({
      db,
      params,
      status,
      request,
      requestId,
      traceId,
      ip,
      userAgent,
      tenantId,
      actorId,
      actorRole,
    }) => {
      try {
        const { before, deleted } = await deleteVehicleService(db, {
          id: params.id,
        });
        await auditVehicleEvent(
          {
            request,
            requestId,
            traceId,
            ip,
            userAgent,
            tenantId,
            actorId,
            actorRole,
          },
          db,
          {
            action: "INVENTORY.VEHICLE.DELETE",
            entityId: deleted.id,
            before,
          },
        );
        return deleted;
      } catch (error) {
        const mapped = mapInventoryError(error, status);
        if (error instanceof Error) {
          await auditVehicleEvent(
            {
              request,
              requestId,
              traceId,
              ip,
              userAgent,
              tenantId,
              actorId,
              actorRole,
            },
            db,
            {
              action: "INVENTORY.VEHICLE.DELETE",
              entityId: params.id,
              result: "failed",
              error: error.message.slice(0, 200),
            },
          ).catch(() => {});
        }
        return mapped;
      }
    },
    {
      beforeHandle: requirePermission("inventory:delete"),
      params: IdParamSchema,
    },
  )
  .patch(
    "/vehicles/:id/document-status",
    async ({
      db,
      params,
      body,
      status,
      request,
      requestId,
      traceId,
      ip,
      userAgent,
      tenantId,
      actorId,
      actorRole,
    }) => {
      try {
        const { before, updated } = await updateDocumentStatusService(db, {
          vehicleId: params.id,
          input: body,
        });
        await auditVehicleEvent(
          {
            request,
            requestId,
            traceId,
            ip,
            userAgent,
            tenantId,
            actorId,
            actorRole,
          },
          db,
          {
            action: "INVENTORY.VEHICLE.DOCUMENT_STATUS_UPDATE",
            entityId: updated.id,
            before: {
              importInvoiceReceived: before.importInvoiceReceived,
              technicalInspectionReceived: before.technicalInspectionReceived,
              registrationReady: before.registrationReady,
            },
            after: {
              importInvoiceReceived: updated.importInvoiceReceived,
              technicalInspectionReceived: updated.technicalInspectionReceived,
              registrationReady: updated.registrationReady,
            },
          },
        );
        return updated;
      } catch (error) {
        return mapInventoryError(error, status);
      }
    },
    {
      beforeHandle: requirePermission("inventory:update"),
      params: IdParamSchema,
      body: UpdateVehicleDocumentStatusSchema,
    },
  )
  .post(
    "/vehicles/:id/documents",
    async ({
      db,
      params,
      body,
      status,
      user,
      request,
      requestId,
      traceId,
      ip,
      userAgent,
      tenantId,
      actorId,
      actorRole,
    }) => {
      try {
        const result = await addVehicleDocumentService(db, {
          vehicleId: params.id,
          input: body,
          uploadedBy: user?.id ?? null,
        });
        await auditVehicleEvent(
          {
            request,
            requestId,
            traceId,
            ip,
            userAgent,
            tenantId,
            actorId,
            actorRole,
          },
          db,
          {
            action: "INVENTORY.VEHICLE.DOCUMENT_ADD",
            entityId: params.id,
            after: result.document,
          },
        );
        return status(201, result.vehicle);
      } catch (error) {
        return mapInventoryError(error, status);
      }
    },
    {
      beforeHandle: requirePermission("inventory:update"),
      params: IdParamSchema,
      body: CreateVehicleDocumentSchema,
    },
  )
  .delete(
    "/vehicles/:id/documents/:docId",
    async ({
      db,
      params,
      status,
      request,
      requestId,
      traceId,
      ip,
      userAgent,
      tenantId,
      actorId,
      actorRole,
    }) => {
      try {
        const { deleted, vehicle } = await deleteVehicleDocumentService(db, {
          vehicleId: params.id,
          docId: params.docId,
        });
        await auditVehicleEvent(
          {
            request,
            requestId,
            traceId,
            ip,
            userAgent,
            tenantId,
            actorId,
            actorRole,
          },
          db,
          {
            action: "INVENTORY.VEHICLE.DOCUMENT_DELETE",
            entityId: params.id,
            before: deleted,
          },
        );
        return vehicle;
      } catch (error) {
        return mapInventoryError(error, status);
      }
    },
    {
      beforeHandle: requirePermission("inventory:update"),
      params: VehicleDocumentParamSchema,
    },
  );
