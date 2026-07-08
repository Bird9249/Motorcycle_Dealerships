import { format } from "date-fns";
import { and, eq, gte, lt, lte, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { user } from "@/server/platform/db/schema/auth";
import { customers } from "@/server/platform/db/schema/customers";
import {
  paymentAccounts,
  payments,
} from "@/server/platform/db/schema/payments";
import { paymentSchedules, salesOrders } from "@/server/platform/db/schema/sales";
import { buildOrderBy, buildWhereGroups } from "@/shared/db/query";
import type { DbTransaction } from "@/shared/types";
import type { PaymentsListQueryDTO } from "../contracts";

const verifiedByUser = alias(user, "verified_by_user");

const listColumns = {
  id: payments.id,
  paymentNumber: payments.paymentNumber,
  salesOrderId: payments.salesOrderId,
  paymentScheduleId: payments.paymentScheduleId,
  paymentAccountId: payments.paymentAccountId,
  amount: payments.amount,
  currency: payments.currency,
  paymentMethod: payments.paymentMethod,
  paidAt: payments.paidAt,
  status: payments.status,
  slipImageKey: payments.slipImageKey,
  slipVerified: payments.slipVerified,
  recordedBy: payments.recordedBy,
  createdAt: payments.createdAt,
} as const;

export async function generatePaymentNumber(client: DbTransaction) {
  const now = new Date();
  const datePart = format(now, "yyyyMMdd");
  const prefix = `PAY-${datePart}-`;

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const countRow = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(payments)
    .where(and(gte(payments.createdAt, start), lt(payments.createdAt, end)));

  const seq = (countRow[0]?.count ?? 0) + 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function sumVerifiedAmountForSchedule(
  paymentScheduleId: string,
  client: DbTransaction,
  excludePaymentId?: string,
) {
  const conditions = [
    eq(payments.paymentScheduleId, paymentScheduleId),
    eq(payments.status, "verified"),
  ];
  if (excludePaymentId) {
    conditions.push(ne(payments.id, excludePaymentId));
  }

  const rows = await client
    .select({
      total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .where(and(...conditions));

  return rows[0]?.total ?? "0";
}

export async function insertPayment(
  values: typeof payments.$inferInsert,
  client: DbTransaction,
) {
  const [created] = await client.insert(payments).values(values).returning({
    id: payments.id,
  });
  if (!created) return null;
  return getPaymentById(created.id, client);
}

export async function updatePaymentById(
  id: string,
  values: Partial<typeof payments.$inferInsert>,
  client: DbTransaction,
) {
  const [updated] = await client
    .update(payments)
    .set(values)
    .where(eq(payments.id, id))
    .returning({ id: payments.id });
  if (!updated) return null;
  return getPaymentById(updated.id, client);
}

export async function sumVerifiedAmountsByAccountForDay(
  dayStart: Date,
  dayEnd: Date,
  client: DbTransaction,
) {
  const rows = await client
    .select({
      paymentAccountId: payments.paymentAccountId,
      total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.status, "verified"),
        gte(payments.paidAt, dayStart),
        lte(payments.paidAt, dayEnd),
      ),
    )
    .groupBy(payments.paymentAccountId);

  return Object.fromEntries(
    rows.map((row) => [row.paymentAccountId, row.total]),
  );
}

export async function countPendingPayments(client: DbTransaction) {
  const rows = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(payments)
    .where(eq(payments.status, "pending"));
  return rows[0]?.count ?? 0;
}

export async function getPaymentSnapshot(id: string, client: DbTransaction) {
  const rows = await client
    .select({
      id: payments.id,
      paymentNumber: payments.paymentNumber,
      salesOrderId: payments.salesOrderId,
      paymentScheduleId: payments.paymentScheduleId,
      paymentAccountId: payments.paymentAccountId,
      amount: payments.amount,
      currency: payments.currency,
      paymentMethod: payments.paymentMethod,
      status: payments.status,
      slipImageKey: payments.slipImageKey,
      slipVerified: payments.slipVerified,
      notes: payments.notes,
    })
    .from(payments)
    .where(eq(payments.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getPaymentById(id: string, client: DbTransaction) {
  const rows = await client
    .select({
      id: payments.id,
      paymentNumber: payments.paymentNumber,
      salesOrderId: payments.salesOrderId,
      paymentScheduleId: payments.paymentScheduleId,
      paymentAccountId: payments.paymentAccountId,
      amount: payments.amount,
      currency: payments.currency,
      paymentMethod: payments.paymentMethod,
      paidAt: payments.paidAt,
      slipImageKey: payments.slipImageKey,
      slipVerified: payments.slipVerified,
      slipVerifiedAt: payments.slipVerifiedAt,
      slipVerifiedBy: payments.slipVerifiedBy,
      status: payments.status,
      notes: payments.notes,
      recordedBy: payments.recordedBy,
      createdAt: payments.createdAt,
      updatedAt: payments.updatedAt,
      paymentAccountName: paymentAccounts.name,
      paymentAccountType: paymentAccounts.type,
      orderNumber: salesOrders.orderNumber,
      customerFullName: customers.fullName,
      installmentNumber: paymentSchedules.installmentNumber,
      scheduleAmount: paymentSchedules.amount,
      recordedByName: user.name,
      verifiedByName: verifiedByUser.name,
    })
    .from(payments)
    .innerJoin(
      paymentAccounts,
      eq(paymentAccounts.id, payments.paymentAccountId),
    )
    .leftJoin(salesOrders, eq(salesOrders.id, payments.salesOrderId))
    .leftJoin(customers, eq(customers.id, salesOrders.customerId))
    .leftJoin(
      paymentSchedules,
      eq(paymentSchedules.id, payments.paymentScheduleId),
    )
    .leftJoin(user, eq(user.id, payments.recordedBy))
    .leftJoin(verifiedByUser, eq(verifiedByUser.id, payments.slipVerifiedBy))
    .where(eq(payments.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    paymentNumber: row.paymentNumber,
    salesOrderId: row.salesOrderId,
    paymentScheduleId: row.paymentScheduleId,
    paymentAccountId: row.paymentAccountId,
    amount: row.amount,
    currency: row.currency,
    paymentMethod: row.paymentMethod,
    paidAt: row.paidAt,
    slipImageKey: row.slipImageKey,
    slipVerified: row.slipVerified,
    slipVerifiedAt: row.slipVerifiedAt,
    slipVerifiedBy: row.slipVerifiedBy,
    status: row.status,
    notes: row.notes,
    recordedBy: row.recordedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    paymentAccount: {
      id: row.paymentAccountId,
      name: row.paymentAccountName,
      type: row.paymentAccountType,
    },
    salesOrder: row.salesOrderId
      ? {
          id: row.salesOrderId,
          orderNumber: row.orderNumber!,
          customerName: row.customerFullName!,
        }
      : null,
    schedule: row.paymentScheduleId
      ? {
          id: row.paymentScheduleId,
          installmentNumber: row.installmentNumber!,
          amount: row.scheduleAmount!,
        }
      : null,
    recordedByUser: row.recordedByName
      ? { name: row.recordedByName }
      : null,
    verifiedByUser: row.verifiedByName
      ? { name: row.verifiedByName }
      : null,
  };
}

export async function listPayments(
  query: PaymentsListQueryDTO,
  client: DbTransaction,
) {
  const extraFilters = [];
  if (query.status) extraFilters.push(eq(payments.status, query.status));
  if (query.paymentAccountId) {
    extraFilters.push(eq(payments.paymentAccountId, query.paymentAccountId));
  }
  if (query.salesOrderId) {
    extraFilters.push(eq(payments.salesOrderId, query.salesOrderId));
  }
  if (query.dateFrom) {
    extraFilters.push(gte(payments.paidAt, query.dateFrom));
  }
  if (query.dateTo) {
    const end = new Date(query.dateTo);
    end.setHours(23, 59, 59, 999);
    extraFilters.push(lte(payments.paidAt, end));
  }

  const whereExpr = buildWhereGroups(listColumns, query.filters ?? []);
  const combinedWhere =
    extraFilters.length > 0
      ? whereExpr
        ? and(whereExpr, ...extraFilters)
        : and(...extraFilters)
      : whereExpr;

  const orderBy = buildOrderBy(listColumns, query.sort);
  const defaultOrder = sql`${payments.createdAt} desc`;

  const [rows, countRow] = await Promise.all([
    client
      .select({
        id: payments.id,
        paymentNumber: payments.paymentNumber,
        salesOrderId: payments.salesOrderId,
        paymentScheduleId: payments.paymentScheduleId,
        paymentAccountId: payments.paymentAccountId,
        amount: payments.amount,
        currency: payments.currency,
        paymentMethod: payments.paymentMethod,
        paidAt: payments.paidAt,
        status: payments.status,
        slipImageKey: payments.slipImageKey,
        slipVerified: payments.slipVerified,
        createdAt: payments.createdAt,
        paymentAccountName: paymentAccounts.name,
        orderNumber: salesOrders.orderNumber,
        installmentNumber: paymentSchedules.installmentNumber,
      })
      .from(payments)
      .innerJoin(
        paymentAccounts,
        eq(paymentAccounts.id, payments.paymentAccountId),
      )
      .leftJoin(salesOrders, eq(salesOrders.id, payments.salesOrderId))
      .leftJoin(
        paymentSchedules,
        eq(paymentSchedules.id, payments.paymentScheduleId),
      )
      .where(combinedWhere)
      .orderBy(...(orderBy?.length ? orderBy : [defaultOrder]))
      .limit(query.limit)
      .offset(query.offset),
    client
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(payments)
      .where(combinedWhere),
  ]);

  const data = rows.map((row) => ({
    id: row.id,
    paymentNumber: row.paymentNumber,
    salesOrderId: row.salesOrderId,
    paymentScheduleId: row.paymentScheduleId,
    paymentAccountId: row.paymentAccountId,
    amount: row.amount,
    currency: row.currency,
    paymentMethod: row.paymentMethod,
    paidAt: row.paidAt,
    status: row.status,
    slipImageKey: row.slipImageKey,
    slipVerified: row.slipVerified,
    createdAt: row.createdAt,
    paymentAccountName: row.paymentAccountName,
    orderNumber: row.orderNumber,
    installmentNumber: row.installmentNumber,
  }));

  return {
    data,
    meta: {
      total: countRow[0]?.count ?? 0,
      limit: query.limit,
      offset: query.offset,
    },
  };
}
