import { Elysia } from "elysia";
import {
  buildAuditEvent,
  getAuditContextFromRequest,
} from "@/modules/audit/domain/http/helpers";
import { appendAudit } from "@/modules/audit/domain/services/append-audit";
import { Permissions } from "@/modules/roles/domain/contracts/permissions";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { env } from "@/server/platform/config";
import {
  CreatePaymentAccountSchema,
  CreatePaymentSchema,
  IdParamSchema,
  PaymentAccountsListQuerySchema,
  PaymentsListQuerySchema,
  RejectPaymentSchema,
  ReconciliationDateParamSchema,
  ReconciliationQuerySchema,
  UpdatePaymentAccountSchema,
  UpdatePaymentAccountStatusSchema,
  UpsertReconciliationSchema,
} from "../contracts";
import {
  getPaymentAccountById,
  listPaymentAccounts,
} from "../repo/payment-accounts";
import {
  getPaymentById,
  listPayments,
  countPendingPayments,
} from "../repo/payments";
import {
  createPaymentAccountService,
  getReconciliationSummary,
  recordPaymentService,
  rejectPaymentService,
  updatePaymentAccountService,
  updatePaymentAccountStatusService,
  upsertReconciliationService,
  verifyPaymentService,
} from "../service";
import { mapPaymentsError } from "./map-error";

type AuditCtx = Parameters<typeof getAuditContextFromRequest>[1] & {
  request: Request;
};

async function auditPaymentEvent(
  ctx: AuditCtx,
  db: Parameters<typeof appendAudit>[0],
  params: {
    action: string;
    entityType: "payment" | "payment_account" | "daily_reconciliation";
    entityId?: string;
    before?: unknown;
    after?: unknown;
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
    }),
  ]);
}

function auditCtxFromRoute(ctx: Record<string, unknown>): AuditCtx {
  return ctx as AuditCtx;
}

function filePublicUrl(key: string) {
  return `${env.CORS_ORIGIN}/api/files/${key}`;
}

function mapAccountWithQrUrl<
  T extends { qrCodeImageKey: string | null },
>(account: T) {
  return {
    ...account,
    qrCodeUrl: account.qrCodeImageKey
      ? filePublicUrl(account.qrCodeImageKey)
      : null,
  };
}

function mapPaymentWithSlipUrl<
  T extends { slipImageKey: string | null },
>(payment: T) {
  return {
    ...payment,
    slipUrl: payment.slipImageKey
      ? filePublicUrl(payment.slipImageKey)
      : null,
  };
}

export const paymentsRoutes = new Elysia()
  .use(serverContext)
  .get(
    "/accounts",
    async ({ db, query }) => {
      const rows = await listPaymentAccounts(
        {
          active: query.active ?? "true",
          q: query.q,
          type: query.type,
        },
        db,
      );
      return rows.map(mapAccountWithQrUrl);
    },
    {
      beforeHandle: requirePermission(Permissions.payments.read),
      query: PaymentAccountsListQuerySchema,
    },
  )
  .get(
    "/accounts/:id",
    async ({ db, params, status }) => {
      const account = await getPaymentAccountById(params.id, db);
      if (!account) return status(404, { error: "NOT_FOUND" });
      return mapAccountWithQrUrl(account);
    },
    {
      beforeHandle: requirePermission(Permissions.payments.read),
      params: IdParamSchema,
    },
  )
  .get(
    "/accounts/:id/qr",
    async ({ db, params, status }) => {
      const account = await getPaymentAccountById(params.id, db);
      if (!account) return status(404, { error: "NOT_FOUND" });
      if (!account.qrCodeImageKey) {
        return status(404, {
          error: "NOT_FOUND",
          message: "QR code not configured for this account",
        });
      }
      return {
        accountId: account.id,
        qrCodeImageKey: account.qrCodeImageKey,
        qrCodeUrl: filePublicUrl(account.qrCodeImageKey),
      };
    },
    {
      beforeHandle: requirePermission(Permissions.payments.read),
      params: IdParamSchema,
    },
  )
  .post(
    "/accounts",
    async (ctx) => {
      const { db, body, status } = ctx;
      try {
        const { created } = await createPaymentAccountService(db, {
          input: body,
        });
        await auditPaymentEvent(auditCtxFromRoute(ctx), db, {
          action: "PAYMENT_ACCOUNT.CREATE",
          entityType: "payment_account",
          entityId: created.id,
          after: created,
        });
        return status(201, mapAccountWithQrUrl(created));
      } catch (error) {
        return mapPaymentsError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.payments.update),
      body: CreatePaymentAccountSchema,
    },
  )
  .put(
    "/accounts/:id",
    async (ctx) => {
      const { db, params, body, status } = ctx;
      try {
        const { before, updated } = await updatePaymentAccountService(db, {
          id: params.id,
          input: body,
        });
        await auditPaymentEvent(auditCtxFromRoute(ctx), db, {
          action: "PAYMENT_ACCOUNT.UPDATE",
          entityType: "payment_account",
          entityId: updated.id,
          before,
          after: updated,
        });
        return mapAccountWithQrUrl(updated);
      } catch (error) {
        return mapPaymentsError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.payments.update),
      params: IdParamSchema,
      body: UpdatePaymentAccountSchema,
    },
  )
  .patch(
    "/accounts/:id/status",
    async (ctx) => {
      const { db, params, body, status } = ctx;
      try {
        const { before, updated } = await updatePaymentAccountStatusService(
          db,
          { id: params.id, isActive: body.isActive },
        );
        await auditPaymentEvent(auditCtxFromRoute(ctx), db, {
          action: "PAYMENT_ACCOUNT.UPDATE",
          entityType: "payment_account",
          entityId: updated.id,
          before,
          after: updated,
        });
        return mapAccountWithQrUrl(updated);
      } catch (error) {
        return mapPaymentsError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.payments.update),
      params: IdParamSchema,
      body: UpdatePaymentAccountStatusSchema,
    },
  )
  .get(
    "/pending-count",
    async ({ db }) => {
      const count = await countPendingPayments(db);
      return { count };
    },
    {
      beforeHandle: requirePermission(Permissions.payments.verify),
    },
  )
  .get(
    "/reconciliation",
    async ({ db, query }) => {
      return getReconciliationSummary(db, query.date);
    },
    {
      beforeHandle: requirePermission(Permissions.payments.reconcile),
      query: ReconciliationQuerySchema,
    },
  )
  .get(
    "/reconciliation/:date",
    async ({ db, params }) => {
      const date = new Date(`${params.date}T00:00:00`);
      return getReconciliationSummary(db, date);
    },
    {
      beforeHandle: requirePermission(Permissions.payments.reconcile),
      params: ReconciliationDateParamSchema,
    },
  )
  .post(
    "/reconciliation",
    async (ctx) => {
      const { db, body, status, user } = ctx;
      if (!user?.id) return status(401, { error: "Unauthorized" });
      try {
        const { upserted, summary } = await upsertReconciliationService(db, {
          input: body,
          reconciledBy: user.id,
        });
        await auditPaymentEvent(auditCtxFromRoute(ctx), db, {
          action: "RECONCILIATION.UPSERT",
          entityType: "daily_reconciliation",
          entityId: upserted[0]?.id,
          after: {
            reconciliationDate: summary.reconciliationDate,
            items: upserted.map((row) => ({
              id: row.id,
              paymentAccountId: row.paymentAccountId,
              expectedAmount: row.expectedAmount,
              actualAmount: row.actualAmount,
              difference: row.difference,
              status: row.status,
            })),
          },
        });
        return summary;
      } catch (error) {
        return mapPaymentsError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.payments.reconcile),
      body: UpsertReconciliationSchema,
    },
  )
  .get(
    "/",
    async ({ db, query }) => {
      const result = await listPayments(query, db);
      return {
        ...result,
        data: result.data.map(mapPaymentWithSlipUrl),
      };
    },
    {
      beforeHandle: requirePermission(Permissions.payments.read),
      query: PaymentsListQuerySchema,
    },
  )
  .post(
    "/",
    async (ctx) => {
      const { db, body, status, user } = ctx;
      if (!user?.id) return status(401, { error: "Unauthorized" });
      try {
        const { created } = await recordPaymentService(db, {
          input: body,
          recordedBy: user.id,
        });
        await auditPaymentEvent(auditCtxFromRoute(ctx), db, {
          action: "PAYMENT.CREATE",
          entityType: "payment",
          entityId: created.id,
          after: {
            id: created.id,
            paymentNumber: created.paymentNumber,
            salesOrderId: created.salesOrderId,
            paymentScheduleId: created.paymentScheduleId,
            amount: created.amount,
            status: created.status,
          },
        });
        return status(201, mapPaymentWithSlipUrl(created));
      } catch (error) {
        return mapPaymentsError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.payments.create),
      body: CreatePaymentSchema,
    },
  )
  .get(
    "/:id",
    async ({ db, params, status }) => {
      const payment = await getPaymentById(params.id, db);
      if (!payment) return status(404, { error: "NOT_FOUND" });
      return mapPaymentWithSlipUrl(payment);
    },
    {
      beforeHandle: requirePermission(Permissions.payments.read),
      params: IdParamSchema,
    },
  )
  .post(
    "/:id/verify",
    async (ctx) => {
      const { db, params, status, user } = ctx;
      if (!user?.id) return status(401, { error: "Unauthorized" });
      try {
        const { before, updated } = await verifyPaymentService(db, {
          id: params.id,
          verifiedBy: user.id,
        });
        await auditPaymentEvent(auditCtxFromRoute(ctx), db, {
          action: "PAYMENT.VERIFY",
          entityType: "payment",
          entityId: updated.id,
          before,
          after: {
            id: updated.id,
            paymentNumber: updated.paymentNumber,
            status: updated.status,
            slipVerified: updated.slipVerified,
          },
        });
        return mapPaymentWithSlipUrl(updated);
      } catch (error) {
        return mapPaymentsError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.payments.verify),
      params: IdParamSchema,
    },
  )
  .post(
    "/:id/reject",
    async (ctx) => {
      const { db, params, body, status, user } = ctx;
      if (!user?.id) return status(401, { error: "Unauthorized" });
      try {
        const { before, updated } = await rejectPaymentService(db, {
          id: params.id,
          rejectedBy: user.id,
          reason: body.reason,
        });
        await auditPaymentEvent(auditCtxFromRoute(ctx), db, {
          action: "PAYMENT.REJECT",
          entityType: "payment",
          entityId: updated.id,
          before,
          after: {
            id: updated.id,
            paymentNumber: updated.paymentNumber,
            status: updated.status,
            slipVerified: updated.slipVerified,
          },
        });
        return mapPaymentWithSlipUrl(updated);
      } catch (error) {
        return mapPaymentsError(error, status);
      }
    },
    {
      beforeHandle: requirePermission(Permissions.payments.reject),
      params: IdParamSchema,
      body: RejectPaymentSchema,
    },
  );
