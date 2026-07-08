import { and, eq, gte, lte, sql } from "drizzle-orm";
import {
  paymentAccounts,
  payments,
} from "@/server/platform/db/schema/payments";
import { countPendingPayments } from "@/modules/payments/domain/repo/payments";
import type { DbTransaction } from "@/shared/types";
import type {
  PaymentsReportDTO,
  PaymentsReportQueryDTO,
} from "../contracts";
import { resolveReportPeriod } from "../lib/resolve-report-period";

export async function getPaymentsReport(
  query: PaymentsReportQueryDTO,
  client: DbTransaction,
): Promise<PaymentsReportDTO> {
  const { dateFrom, dateTo, preset } = resolveReportPeriod(query);

  const verifiedFilter = and(
    eq(payments.status, "verified"),
    gte(payments.paidAt, dateFrom),
    lte(payments.paidAt, dateTo),
  );

  const [pendingCount, byAccountRows, byCurrencyRows] = await Promise.all([
    countPendingPayments(client),
    client
      .select({
        accountId: payments.paymentAccountId,
        name: paymentAccounts.name,
        currency: paymentAccounts.currency,
        total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(payments)
      .innerJoin(
        paymentAccounts,
        eq(paymentAccounts.id, payments.paymentAccountId),
      )
      .where(verifiedFilter)
      .groupBy(
        payments.paymentAccountId,
        paymentAccounts.name,
        paymentAccounts.currency,
      )
      .orderBy(sql`sum(${payments.amount}) desc`),
    client
      .select({
        currency: payments.currency,
        totalAmount: sql<string>`coalesce(sum(${payments.amount}), 0)`,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(payments)
      .where(verifiedFilter)
      .groupBy(payments.currency),
  ]);

  return {
    period: {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      preset,
    },
    pendingCount,
    verifiedByAccount: byAccountRows.map((row) => ({
      accountId: row.accountId,
      name: row.name,
      currency: row.currency,
      total: row.total,
      count: row.count,
    })),
    verifiedByCurrency: byCurrencyRows.map((row) => ({
      currency: row.currency,
      totalAmount: row.totalAmount,
      count: row.count,
    })),
  };
}
