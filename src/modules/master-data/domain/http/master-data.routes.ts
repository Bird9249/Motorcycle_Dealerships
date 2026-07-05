import { Elysia } from "elysia";
import {
  buildAuditEvent,
  getAuditContextFromRequest,
} from "@/modules/audit/domain/http/helpers";
import { appendAudit } from "@/modules/audit/domain/services/append-audit";
import { Permissions } from "@/modules/roles/domain/contracts/permissions";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import {
  BrandsListQuerySchema,
  ColorsListQuerySchema,
  CreateBrandSchema,
  CreateColorSchema,
  CreateModelSchema,
  IdParamSchema,
  ModelsListQuerySchema,
  UpdateActiveStatusSchema,
  UpdateBrandSchema,
  UpdateColorSchema,
  UpdateModelSchema,
} from "../contracts";
import { mapMasterDataError } from "./map-error";
import { getBrandById, listBrands } from "../repo/brands";
import { getColorById, listColors } from "../repo/colors";
import { getModelById, listModels } from "../repo/models";
import {
  createBrandService,
  createColorService,
  createModelService,
  updateBrandService,
  updateBrandStatusService,
  updateColorService,
  updateColorStatusService,
  updateModelService,
  updateModelStatusService,
} from "../service";

type AuditCtx = Parameters<typeof getAuditContextFromRequest>[1] & {
  request: Request;
};

async function auditMasterDataEvent(
  ctx: AuditCtx,
  db: Parameters<typeof appendAudit>[0],
  params: {
    action: string;
    entityType: "brand" | "model" | "color";
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
      entityType: params.entityType,
      entityId: params.entityId,
      before: params.before,
      after: params.after,
      result: params.result,
      error: params.error,
    }),
  ]);
}

function auditCtxFromRoute(ctx: Record<string, unknown>): AuditCtx {
  return ctx as AuditCtx;
}

export const masterDataRoutes = new Elysia()
  .use(serverContext)
  // Brands
  .get(
    "/brands",
    async ({ db, query }) => listBrands(query, db),
    {
      beforeHandle: requirePermission(Permissions.masterData.read),
      query: BrandsListQuerySchema,
    },
  )
  .get(
    "/brands/:id",
    async ({ db, params, status }) => {
      const brand = await getBrandById(params.id, db);
      if (!brand) return status(404, { error: "NOT_FOUND" });
      return brand;
    },
    {
      beforeHandle: requirePermission(Permissions.masterData.read),
      params: IdParamSchema,
    },
  )
  .post(
    "/brands",
    async (ctx) => {
      const { db, body, status } = ctx;
      try {
        const { created } = await createBrandService(db, { input: body });
        await auditMasterDataEvent(auditCtxFromRoute(ctx), db, {
          action: "MASTER_DATA.BRAND.CREATE",
          entityType: "brand",
          entityId: created.id,
          after: created,
        });
        return status(201, created);
      } catch (error) {
        return mapMasterDataError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.masterData.create),
      body: CreateBrandSchema,
    },
  )
  .put(
    "/brands/:id",
    async (ctx) => {
      const { db, params, body, status } = ctx;
      try {
        const { before, updated } = await updateBrandService(db, {
          id: params.id,
          input: body,
        });
        await auditMasterDataEvent(auditCtxFromRoute(ctx), db, {
          action: "MASTER_DATA.BRAND.UPDATE",
          entityType: "brand",
          entityId: updated.id,
          before,
          after: updated,
        });
        return updated;
      } catch (error) {
        return mapMasterDataError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.masterData.update),
      params: IdParamSchema,
      body: UpdateBrandSchema,
    },
  )
  .patch(
    "/brands/:id/status",
    async (ctx) => {
      const { db, params, body, status } = ctx;
      try {
        const { before, updated } = await updateBrandStatusService(db, {
          id: params.id,
          isActive: body.isActive,
        });
        await auditMasterDataEvent(auditCtxFromRoute(ctx), db, {
          action: "MASTER_DATA.BRAND.STATUS_UPDATE",
          entityType: "brand",
          entityId: updated.id,
          before: { isActive: before.isActive },
          after: { isActive: updated.isActive },
        });
        return updated;
      } catch (error) {
        return mapMasterDataError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.masterData.update),
      params: IdParamSchema,
      body: UpdateActiveStatusSchema,
    },
  )
  // Models
  .get(
    "/models",
    async ({ db, query }) => listModels(query, db),
    {
      beforeHandle: requirePermission(Permissions.masterData.read),
      query: ModelsListQuerySchema,
    },
  )
  .get(
    "/models/:id",
    async ({ db, params, status }) => {
      const model = await getModelById(params.id, db);
      if (!model) return status(404, { error: "NOT_FOUND" });
      return model;
    },
    {
      beforeHandle: requirePermission(Permissions.masterData.read),
      params: IdParamSchema,
    },
  )
  .post(
    "/models",
    async (ctx) => {
      const { db, body, status } = ctx;
      try {
        const { created } = await createModelService(db, { input: body });
        await auditMasterDataEvent(auditCtxFromRoute(ctx), db, {
          action: "MASTER_DATA.MODEL.CREATE",
          entityType: "model",
          entityId: created.id,
          after: created,
        });
        return status(201, created);
      } catch (error) {
        return mapMasterDataError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.masterData.create),
      body: CreateModelSchema,
    },
  )
  .put(
    "/models/:id",
    async (ctx) => {
      const { db, params, body, status } = ctx;
      try {
        const { before, updated } = await updateModelService(db, {
          id: params.id,
          input: body,
        });
        await auditMasterDataEvent(auditCtxFromRoute(ctx), db, {
          action: "MASTER_DATA.MODEL.UPDATE",
          entityType: "model",
          entityId: updated.id,
          before,
          after: updated,
        });
        return updated;
      } catch (error) {
        return mapMasterDataError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.masterData.update),
      params: IdParamSchema,
      body: UpdateModelSchema,
    },
  )
  .patch(
    "/models/:id/status",
    async (ctx) => {
      const { db, params, body, status } = ctx;
      try {
        const { before, updated } = await updateModelStatusService(db, {
          id: params.id,
          isActive: body.isActive,
        });
        await auditMasterDataEvent(auditCtxFromRoute(ctx), db, {
          action: "MASTER_DATA.MODEL.STATUS_UPDATE",
          entityType: "model",
          entityId: updated.id,
          before: { isActive: before.isActive },
          after: { isActive: updated.isActive },
        });
        return updated;
      } catch (error) {
        return mapMasterDataError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.masterData.update),
      params: IdParamSchema,
      body: UpdateActiveStatusSchema,
    },
  )
  // Colors
  .get(
    "/colors",
    async ({ db, query }) => listColors(query, db),
    {
      beforeHandle: requirePermission(Permissions.masterData.read),
      query: ColorsListQuerySchema,
    },
  )
  .get(
    "/colors/:id",
    async ({ db, params, status }) => {
      const color = await getColorById(params.id, db);
      if (!color) return status(404, { error: "NOT_FOUND" });
      return color;
    },
    {
      beforeHandle: requirePermission(Permissions.masterData.read),
      params: IdParamSchema,
    },
  )
  .post(
    "/colors",
    async (ctx) => {
      const { db, body, status } = ctx;
      try {
        const { created } = await createColorService(db, { input: body });
        await auditMasterDataEvent(auditCtxFromRoute(ctx), db, {
          action: "MASTER_DATA.COLOR.CREATE",
          entityType: "color",
          entityId: created.id,
          after: created,
        });
        return status(201, created);
      } catch (error) {
        return mapMasterDataError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.masterData.create),
      body: CreateColorSchema,
    },
  )
  .put(
    "/colors/:id",
    async (ctx) => {
      const { db, params, body, status } = ctx;
      try {
        const { before, updated } = await updateColorService(db, {
          id: params.id,
          input: body,
        });
        await auditMasterDataEvent(auditCtxFromRoute(ctx), db, {
          action: "MASTER_DATA.COLOR.UPDATE",
          entityType: "color",
          entityId: updated.id,
          before,
          after: updated,
        });
        return updated;
      } catch (error) {
        return mapMasterDataError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.masterData.update),
      params: IdParamSchema,
      body: UpdateColorSchema,
    },
  )
  .patch(
    "/colors/:id/status",
    async (ctx) => {
      const { db, params, body, status } = ctx;
      try {
        const { before, updated } = await updateColorStatusService(db, {
          id: params.id,
          isActive: body.isActive,
        });
        await auditMasterDataEvent(auditCtxFromRoute(ctx), db, {
          action: "MASTER_DATA.COLOR.STATUS_UPDATE",
          entityType: "color",
          entityId: updated.id,
          before: { isActive: before.isActive },
          after: { isActive: updated.isActive },
        });
        return updated;
      } catch (error) {
        return mapMasterDataError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.masterData.update),
      params: IdParamSchema,
      body: UpdateActiveStatusSchema,
    },
  );
