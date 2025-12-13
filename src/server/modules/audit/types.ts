import type { queryAudit } from "./repo/query";

export type AuditListResult = Awaited<ReturnType<typeof queryAudit>>;
