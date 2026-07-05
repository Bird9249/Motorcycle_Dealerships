import { and, desc, eq, inArray } from "drizzle-orm";
import { auditLogs } from "@/server/platform/db/schema/audit";
import type { DbTransaction } from "@/shared/types";
import type { VehicleStatusHistoryItem } from "../contracts/status-history";
import type { VehicleStatus } from "../contracts/vehicles";

const STATUS_HISTORY_ACTIONS = [
  "INVENTORY.VEHICLE.STATUS_UPDATE",
  "INVENTORY.VEHICLE.CREATE",
] as const;

function readStatus(value: unknown): VehicleStatus | null {
  if (!value || typeof value !== "object") return null;
  const status = (value as { status?: unknown }).status;
  if (
    status === "in_stock" ||
    status === "reserved" ||
    status === "sold" ||
    status === "in_service" ||
    status === "written_off"
  ) {
    return status;
  }
  return null;
}

function mapAuditRow(row: {
  id: string;
  occurredAt: Date;
  action: string;
  actorId: string | null;
  actorRole: string | null;
  before: unknown;
  after: unknown;
}): VehicleStatusHistoryItem | null {
  if (row.action === "INVENTORY.VEHICLE.STATUS_UPDATE") {
    const toStatus = readStatus(row.after);
    if (!toStatus) return null;
    return {
      id: row.id,
      occurredAt: row.occurredAt,
      action: row.action,
      fromStatus: readStatus(row.before),
      toStatus,
      actorId: row.actorId,
      actorRole: row.actorRole,
    };
  }

  if (row.action === "INVENTORY.VEHICLE.CREATE") {
    const toStatus = readStatus(row.after) ?? "in_stock";
    return {
      id: row.id,
      occurredAt: row.occurredAt,
      action: row.action,
      fromStatus: null,
      toStatus,
      actorId: row.actorId,
      actorRole: row.actorRole,
    };
  }

  return null;
}

export async function getVehicleStatusHistory(
  vehicleId: string,
  client: DbTransaction,
): Promise<VehicleStatusHistoryItem[]> {
  const rows = await client
    .select({
      id: auditLogs.id,
      occurredAt: auditLogs.occurredAt,
      action: auditLogs.action,
      actorId: auditLogs.actorId,
      actorRole: auditLogs.actorRole,
      before: auditLogs.before,
      after: auditLogs.after,
    })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.entityType, "vehicle"),
        eq(auditLogs.entityId, vehicleId),
        inArray(auditLogs.action, [...STATUS_HISTORY_ACTIONS]),
        eq(auditLogs.result, "success"),
      ),
    )
    .orderBy(desc(auditLogs.occurredAt))
    .limit(50);

  return rows
    .map(mapAuditRow)
    .filter((item): item is VehicleStatusHistoryItem => item !== null);
}
