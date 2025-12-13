export type AuditResult = "success" | "failed";

export type AuditEvent = {
  id?: string;
  occurredAt: string;
  requestId?: string;
  traceId?: string;
  tenantId?: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  entityType?: string;
  entityId?: string | number;
  result?: AuditResult;
  error?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  before?: unknown;
  after?: unknown;
  meta?: Record<string, unknown>;
};
