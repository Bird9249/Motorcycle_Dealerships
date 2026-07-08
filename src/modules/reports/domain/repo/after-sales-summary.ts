import { addDays, startOfDay } from "date-fns";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { listExpiringWarranties } from "@/modules/after-sales/domain/repo/warranties";
import { serviceRecords, warranties } from "@/server/platform/db/schema/after-sales";
import type { DbTransaction } from "@/shared/types";
import type {
  AfterSalesReportDTO,
  AfterSalesReportQueryDTO,
} from "../contracts";
import { resolveReportPeriod } from "../lib/resolve-report-period";

export async function getAfterSalesReport(
  query: AfterSalesReportQueryDTO,
  client: DbTransaction,
): Promise<AfterSalesReportDTO> {
  const { dateFrom, dateTo, preset } = resolveReportPeriod(query);
  const expiringDays = query.expiringDays ?? 30;
  const expiringLimit = query.expiringLimit ?? 20;

  const today = startOfDay(new Date());
  const horizon = addDays(today, expiringDays);

  const [expiringCountRow, serviceTypeRows, serviceCountRow, expiring] =
    await Promise.all([
      client
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(warranties)
        .where(
          and(
            eq(warranties.status, "active"),
            gte(warranties.endDate, today),
            lte(warranties.endDate, horizon),
          ),
        ),
      client
        .select({
          serviceType: serviceRecords.serviceType,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(serviceRecords)
        .where(
          and(
            gte(serviceRecords.performedAt, dateFrom),
            lte(serviceRecords.performedAt, dateTo),
          ),
        )
        .groupBy(serviceRecords.serviceType),
      client
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(serviceRecords)
        .where(
          and(
            gte(serviceRecords.performedAt, dateFrom),
            lte(serviceRecords.performedAt, dateTo),
          ),
        ),
      listExpiringWarranties(
        { days: expiringDays, limit: expiringLimit },
        client,
      ),
    ]);

  return {
    period: {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      preset,
    },
    expiringWarranties: {
      days: expiringDays,
      count: expiringCountRow[0]?.count ?? 0,
      items: expiring.items,
    },
    serviceByType: serviceTypeRows.map((row) => ({
      serviceType: row.serviceType,
      count: row.count,
    })),
    serviceRecordsInPeriod: serviceCountRow[0]?.count ?? 0,
  };
}
