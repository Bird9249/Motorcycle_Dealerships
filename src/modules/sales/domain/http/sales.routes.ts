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
  ConvertCurrencySchema,
  CreateCustomerSchema,
  CreateFinanceCompanySchema,
  CreateSalesOrderSchema,
  CustomersListQuerySchema,
  FinanceCompaniesListQuerySchema,
  IdParamSchema,
  PreviewPriceConversionsSchema,
  PreviewScheduleBodySchema,
  PreviewScheduleStandaloneSchema,
  SalesOrdersListQuerySchema,
  UpdateCustomerSchema,
  UpdateFinanceCompanySchema,
  UpdateFinanceCompanyStatusSchema,
  UpdateFinanceTransferSchema,
  UpdateSalesOrderSchema,
  UpsertExchangeRatesSchema,
} from "../contracts";
import { getCustomerRecordById, listCustomers } from "../repo/customers";
import { listExchangeRateHistory } from "../repo/exchange-rates-admin";
import { listFinanceCompanies } from "../repo/finance-companies";
import { markOverduePaymentSchedules } from "../repo/payment-schedules-overdue";
import { listLatestExchangeRates } from "../repo/finance-lookups";
import { listPaymentSchedulesByOrderId } from "../repo/payment-schedules";
import {
  getSalesOrderById,
  listSalesOrders,
} from "../repo/sales-orders";
import {
  cancelSaleService,
  completeSaleService,
  confirmSaleService,
  convertCurrencyService,
  createCustomerService,
  createFinanceCompanyService,
  createSaleService,
  getOrderPriceConversionsService,
  previewPriceConversionsService,
  previewScheduleFromInput,
  previewScheduleService,
  updateCustomerService,
  updateFinanceCompanyService,
  updateFinanceCompanyStatusService,
  updateFinanceTransferService,
  updateSaleService,
  upsertExchangeRatesService,
} from "../service";
import { mapSalesError } from "./map-error";

type AuditCtx = Parameters<typeof getAuditContextFromRequest>[1] & {
  request: Request;
};

async function auditSalesEvent(
  ctx: AuditCtx,
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
      entityType: "sales_order",
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

export const salesRoutes = new Elysia()
  .use(serverContext)
  .get(
    "/orders",
    async ({ db, query }) => listSalesOrders(query, db),
    {
      beforeHandle: requirePermission(Permissions.sales.read),
      query: SalesOrdersListQuerySchema,
    },
  )
  .get(
    "/orders/:id",
    async ({ db, params, status }) => {
      const order = await getSalesOrderById(params.id, db);
      if (!order) return status(404, { error: "NOT_FOUND" });
      try {
        const priceConversions = await getOrderPriceConversionsService(
          db,
          params.id,
        );
        return { ...order, priceConversions };
      } catch {
        return order;
      }
    },
    {
      beforeHandle: requirePermission(Permissions.sales.read),
      params: IdParamSchema,
    },
  )
  .post(
    "/orders",
    async (ctx) => {
      const { db, body, status, user } = ctx;
      if (!user?.id) return status(401, { error: "Unauthorized" });
      try {
        const { created } = await createSaleService(db, {
          input: {
            ...body,
            salespersonId: user.id,
            createdBy: user.id,
          },
        });
        await auditSalesEvent(auditCtxFromRoute(ctx), db, {
          action: "SALES.ORDER.CREATE",
          entityId: created.id,
          after: {
            id: created.id,
            orderNumber: created.orderNumber,
            vehicleId: created.vehicleId,
            customerId: created.customerId,
            status: created.status,
            paymentType: created.paymentType,
            salePrice: created.salePrice,
            saleCurrency: created.saleCurrency,
          },
        });
        return status(201, created);
      } catch (error) {
        return mapSalesError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.sales.create),
      body: CreateSalesOrderSchema,
    },
  )
  .put(
    "/orders/:id",
    async (ctx) => {
      const { db, params, body, status } = ctx;
      try {
        const { before, updated } = await updateSaleService(db, {
          id: params.id,
          input: body,
        });
        await auditSalesEvent(auditCtxFromRoute(ctx), db, {
          action: "SALES.ORDER.UPDATE",
          entityId: updated.id,
          before,
          after: {
            id: updated.id,
            orderNumber: updated.orderNumber,
            vehicleId: updated.vehicleId,
            customerId: updated.customerId,
            status: updated.status,
            paymentType: updated.paymentType,
            salePrice: updated.salePrice,
            saleCurrency: updated.saleCurrency,
          },
        });
        return updated;
      } catch (error) {
        return mapSalesError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.sales.update),
      params: IdParamSchema,
      body: UpdateSalesOrderSchema,
    },
  )
  .post(
    "/orders/:id/confirm",
    async (ctx) => {
      const { db, params, status } = ctx;
      try {
        const { before, updated } = await confirmSaleService(db, {
          id: params.id,
        });
        await auditSalesEvent(auditCtxFromRoute(ctx), db, {
          action: "SALES.ORDER.CONFIRM",
          entityId: updated.id,
          before,
          after: {
            id: updated.id,
            orderNumber: updated.orderNumber,
            vehicleId: updated.vehicleId,
            status: updated.status,
            soldAt: updated.soldAt,
          },
        });
        return updated;
      } catch (error) {
        return mapSalesError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.sales.confirm),
      params: IdParamSchema,
    },
  )
  .post(
    "/orders/:id/complete",
    async (ctx) => {
      const { db, params, status } = ctx;
      try {
        const { before, updated } = await completeSaleService(db, {
          id: params.id,
        });
        await auditSalesEvent(auditCtxFromRoute(ctx), db, {
          action: "SALES.ORDER.COMPLETE",
          entityId: updated.id,
          before,
          after: {
            id: updated.id,
            orderNumber: updated.orderNumber,
            status: updated.status,
          },
        });
        return updated;
      } catch (error) {
        return mapSalesError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.sales.confirm),
      params: IdParamSchema,
    },
  )
  .post(
    "/orders/:id/cancel",
    async (ctx) => {
      const { db, params, status } = ctx;
      try {
        const { before, updated } = await cancelSaleService(db, {
          id: params.id,
        });
        await auditSalesEvent(auditCtxFromRoute(ctx), db, {
          action: "SALES.ORDER.CANCEL",
          entityId: updated.id,
          before,
          after: {
            id: updated.id,
            orderNumber: updated.orderNumber,
            vehicleId: updated.vehicleId,
            status: updated.status,
          },
        });
        return updated;
      } catch (error) {
        return mapSalesError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.sales.cancel),
      params: IdParamSchema,
    },
  )
  .get(
    "/orders/:id/schedule",
    async ({ db, params, status }) => {
      const order = await getSalesOrderById(params.id, db);
      if (!order) return status(404, { error: "NOT_FOUND" });
      if (order.paymentType !== "in_house_leasing") {
        return status(422, {
          error: "VALIDATION_LEASING",
          message: "Payment schedule is only available for in-house leasing",
        });
      }
      const schedules = await listPaymentSchedulesByOrderId(params.id, db);
      return { orderId: params.id, schedules };
    },
    {
      beforeHandle: requirePermission(Permissions.sales.read),
      params: IdParamSchema,
    },
  )
  .post(
    "/schedule/preview",
    async (ctx) => {
      const { body, status } = ctx;
      try {
        return previewScheduleFromInput(body);
      } catch (error) {
        return mapSalesError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.sales.read),
      body: PreviewScheduleStandaloneSchema,
    },
  )
  .post(
    "/orders/:id/schedule/preview",
    async (ctx) => {
      const { db, params, body, status } = ctx;
      try {
        return await previewScheduleService(db, {
          orderId: params.id,
          overrides: body,
        });
      } catch (error) {
        return mapSalesError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.sales.create),
      params: IdParamSchema,
      body: PreviewScheduleBodySchema,
    },
  )
  .patch(
    "/orders/:id/finance-transfer",
    async (ctx) => {
      const { db, params, body, status } = ctx;
      try {
        const { before, updated } = await updateFinanceTransferService(db, {
          id: params.id,
          input: body,
        });
        await auditSalesEvent(auditCtxFromRoute(ctx), db, {
          action: "SALES.ORDER.FINANCE_TRANSFER",
          entityId: updated.id,
          before,
          after: {
            id: updated.id,
            orderNumber: updated.orderNumber,
            financeTransferReceived: updated.financeTransferReceived,
            financeTransferDate: updated.financeTransferDate,
          },
        });
        return updated;
      } catch (error) {
        return mapSalesError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.sales.update),
      params: IdParamSchema,
      body: UpdateFinanceTransferSchema,
    },
  )
  .get(
    "/finance-companies",
    async ({ db, query }) =>
      listFinanceCompanies(
        { active: query.active ?? "true", q: query.q },
        db,
      ),
    {
      beforeHandle: requirePermission(Permissions.sales.read),
      query: FinanceCompaniesListQuerySchema,
    },
  )
  .post(
    "/finance-companies",
    async (ctx) => {
      const { db, body, status } = ctx;
      try {
        const { created } = await createFinanceCompanyService(db, {
          input: body,
        });
        await auditSalesEvent(auditCtxFromRoute(ctx), db, {
          action: "SALES.FINANCE_COMPANY.CREATE",
          entityId: created.id,
          after: created,
        });
        return status(201, created);
      } catch (error) {
        return mapSalesError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.sales.create),
      body: CreateFinanceCompanySchema,
    },
  )
  .put(
    "/finance-companies/:id",
    async (ctx) => {
      const { db, params, body, status } = ctx;
      try {
        const { before, updated } = await updateFinanceCompanyService(db, {
          id: params.id,
          input: body,
        });
        await auditSalesEvent(auditCtxFromRoute(ctx), db, {
          action: "SALES.FINANCE_COMPANY.UPDATE",
          entityId: updated.id,
          before,
          after: updated,
        });
        return updated;
      } catch (error) {
        return mapSalesError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.sales.update),
      params: IdParamSchema,
      body: UpdateFinanceCompanySchema,
    },
  )
  .patch(
    "/finance-companies/:id/status",
    async (ctx) => {
      const { db, params, body, status } = ctx;
      try {
        const { before, updated } = await updateFinanceCompanyStatusService(
          db,
          { id: params.id, isActive: body.isActive },
        );
        await auditSalesEvent(auditCtxFromRoute(ctx), db, {
          action: "SALES.FINANCE_COMPANY.STATUS",
          entityId: updated.id,
          before,
          after: updated,
        });
        return updated;
      } catch (error) {
        return mapSalesError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.sales.update),
      params: IdParamSchema,
      body: UpdateFinanceCompanyStatusSchema,
    },
  )
  .get(
    "/customers",
    async ({ db, query }) => listCustomers(query, db),
    {
      beforeHandle: requirePermission(Permissions.sales.read),
      query: CustomersListQuerySchema,
    },
  )
  .post(
    "/customers",
    async ({ db, body, status, user }) => {
      try {
        const { created } = await createCustomerService(db, {
          input: body,
          createdBy: user?.id ?? null,
        });
        return status(201, created);
      } catch (error) {
        return mapSalesError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.sales.create),
      body: CreateCustomerSchema,
    },
  )
  .get(
    "/customers/:id",
    async ({ db, params, status }) => {
      const customer = await getCustomerRecordById(params.id, db);
      if (!customer) return status(404, { error: "NOT_FOUND" });
      return customer;
    },
    {
      beforeHandle: requirePermission(Permissions.sales.read),
      params: IdParamSchema,
    },
  )
  .put(
    "/customers/:id",
    async (ctx) => {
      const { db, params, body, status } = ctx;
      try {
        const { before, updated } = await updateCustomerService(db, {
          id: params.id,
          input: body,
        });
        await auditSalesEvent(auditCtxFromRoute(ctx), db, {
          action: "SALES.CUSTOMER.UPDATE",
          entityId: updated.id,
          before,
          after: updated,
        });
        return updated;
      } catch (error) {
        return mapSalesError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.sales.update),
      params: IdParamSchema,
      body: UpdateCustomerSchema,
    },
  )
  .get(
    "/exchange-rates",
    async ({ db }) => listLatestExchangeRates(db),
    {
      beforeHandle: requirePermission(Permissions.sales.read),
    },
  )
  .get(
    "/exchange-rates/history",
    async ({ db }) => {
      const rows = await listExchangeRateHistory(db);
      return rows.map((row) => ({
        ...row,
        effectiveDate: row.effectiveDate.toISOString().slice(0, 10),
      }));
    },
    {
      beforeHandle: requirePermission(Permissions.sales.read),
    },
  )
  .put(
    "/exchange-rates",
    async (ctx) => {
      const { db, body, status } = ctx;
      try {
        const { upserted } = await upsertExchangeRatesService(db, {
          input: body,
        });
        await auditSalesEvent(auditCtxFromRoute(ctx), db, {
          action: "SALES.EXCHANGE_RATE.UPSERT",
          after: { effectiveDate: body.effectiveDate, rates: upserted },
        });
        return upserted;
      } catch (error) {
        return mapSalesError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.sales.update),
      body: UpsertExchangeRatesSchema,
    },
  )
  .post(
    "/payment-schedules/mark-overdue",
    async (ctx) => {
      const { db, status } = ctx;
      try {
        const result = await db.transaction((tx) =>
          markOverduePaymentSchedules(tx),
        );
        return result;
      } catch (error) {
        return mapSalesError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.sales.update),
    },
  )
  .post(
    "/convert-currency",
    async (ctx) => {
      const { db, body, status } = ctx;
      try {
        return await convertCurrencyService(db, body);
      } catch (error) {
        return mapSalesError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.sales.read),
      body: ConvertCurrencySchema,
    },
  )
  .post(
    "/price-conversions/preview",
    async (ctx) => {
      const { db, body, status } = ctx;
      try {
        return await previewPriceConversionsService(db, body);
      } catch (error) {
        return mapSalesError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.sales.read),
      body: PreviewPriceConversionsSchema,
    },
  )
  .get(
    "/orders/:id/price-conversions",
    async (ctx) => {
      const { db, params, status } = ctx;
      try {
        return await getOrderPriceConversionsService(db, params.id);
      } catch (error) {
        return mapSalesError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.sales.read),
      params: IdParamSchema,
    },
  );
