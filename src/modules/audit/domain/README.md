### Audit module – usage guide for other modules

This document explains when and how other modules should emit audit events in the new service-oriented architecture (no hexagonal layers) and the redaction/allowlist policy.

### When to emit audit events

- After successful state changes: create, update, delete, status transitions.
- On important failures: authentication/authorization failures, business rule violations you need to retain (e.g., AUTH.LOGIN_FAILED).

### What to include in an AuditEvent

- Action name: follow the naming convention below.
- Context fields from HTTP middleware: requestId, traceId, ip, userAgent, plus tenantId, actorId, actorRole if available.
- Entity info: entityType (e.g., "user", "order"), entityId.
- Result: success or failed; include error summary text only when failed.
- Snapshots: before/after objects according to the allowlist policy only.
- Meta: only non-sensitive, redacted metadata that has already passed policy.

Do not include secrets, tokens, raw passwords, or unredacted PII anywhere.

### Naming convention for action

- Use UPPERCASE segments separated by a dot: RESOURCE.ACTION
- Examples:
  - USER.CREATE, USER.UPDATE, USER.DELETE
  - ORDER.CREATE, ORDER.CANCEL, ORDER.PAY
  - AUTH.LOGIN, AUTH.LOGIN_FAILED, AUTH.LOGOUT
- Keep RESOURCE stable and singular; use a short verb for ACTION.

### How to emit audit events (conceptual, no code)

1. Ensure context values are available in the request scope (requestId, traceId, ip, userAgent, tenantId, actorId, actorRole).
2. In the service that performs the mutation, build an AuditEvent with those values, an action string, entityType/entityId, result, and optional error.
3. Provide before/after snapshots restricted to allowed fields per entityType (allowlist). If not available or unknown, omit.
4. Append within the same DB transaction as the state change to ensure atomic write into `audit_outbox`.
5. The outbox message storage (`src/server/shared/outbox/message-storage.ts`) writes to `outbox` table; pg-transactional-outbox service processes messages and flushes to `audit_logs` asynchronously.

### Integration patterns

- A) Service-layer emission (recommended)
  - Emit audit inside the same service that performs the mutation. On success, emit `result='success'`; on handled error, emit `result='failed'` with sanitized error text.
  - Benefits: explicit, simple, transactional.

- B) Event-based emission (optional)
  - Publish application events (e.g., `user.updated`) and subscribe to map them into AuditEvents and append. Ensure idempotency.

### Architectural rules (service-oriented)

- Routes call services directly for actions; services are responsible for appending audit events.
- Read endpoints may call repos directly; only mutation paths should emit audit events.
- Apply redaction/allowlist before writing to the outbox. Never include secrets/tokens/raw PII.

### Transactions, latency, and idempotency

- Append into `outbox` table in the same DB transaction as the state change; this guarantees atomicity. The outbox write uses `storeAuditOutboxMessage` from `src/server/shared/outbox/message-storage.ts`.
- Appends are batched to minimize latency on the main path.
- For idempotency, if calling from retryable flows, ensure a deterministic event identity upstream or let the worker handle duplicates safely when flushing.

### Hash-chain and flushing (for reference)

- The worker reads audit_outbox, groups events (e.g., per-tenant per-day), computes prev_hash/hash, inserts into audit_logs (append-only), then marks outbox rows done.
- Never write audit_logs directly from request paths; only the worker writes audit_logs.

### Testing checklist

- Before/after snapshots conform to allowlist; sensitive keys are masked.
- Context fields are present when available and safe (no secrets).
- Success and failure events follow naming convention and carry minimal necessary detail.
- Outbox append occurs within the same transaction and is resilient to retries.

---

### Migrations and operational policy (append-only, RBAC, indexing, retention)

This section describes database- and ops-level controls for audit durability, performance, and access control.

1. Append-only enforcement for `audit_logs`
   - Revoke UPDATE/DELETE for application roles; only the worker role inserts rows.
   - Create guard triggers to reject UPDATE/DELETE attempts at the DB layer.
   - Example migration outline (PostgreSQL):
     - REVOKE UPDATE, DELETE ON audit_logs FROM app_roles;
     - GRANT SELECT ON audit_logs TO app_readers; GRANT INSERT ON audit_logs TO audit_worker;
     - CREATE FUNCTION prevent_audit_logs_mod() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'audit_logs is append-only'; END; $$;
     - CREATE TRIGGER audit_logs_no_update BEFORE UPDATE ON audit_logs FOR EACH ROW EXECUTE FUNCTION prevent_audit_logs_mod();
     - CREATE TRIGGER audit_logs_no_delete BEFORE DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION prevent_audit_logs_mod();
   - Impact: application code cannot mutate historical records; only the worker appends. Incidents requiring redaction must be handled via policy (masking) and compensating records, not UPDATE/DELETE.

2. Indexing for query performance (already reflected in schema)
   - By time: `occurred_at` → supports time-range queries and default sorting DESC.
   - By tenant+time: `(tenant_id, occurred_at)` → supports tenant-scoped timelines.
   - By entity: `(entity_type, entity_id)` → supports per-entity audit trails.
   - By action: `action` → supports filtering by action names (e.g., USER.UPDATE).
   - Effect: combined with server-side filters/pagination, these indexes keep queries predictable at scale.

3. Retention policy
   - Option A (vanilla Postgres partitioning): range-partition `audit_logs` by day or month; schedule dropping of old partitions (and optional archival to object storage) beyond retention window.
   - Option B (TimescaleDB): convert `audit_logs` into a hypertable on `occurred_at` and use Timescale policies:
     - `add_retention_policy` to drop chunks older than N days.
     - `add_compression_policy` to compress older chunks.
   - Guidance: choose per compliance/SLA; per-tenant per-day chains are compatible with both approaches.

4. RBAC and PII export policy
   - All `/audit` routes must require `requirePermission('audit:read')` (or equivalent) at the route layer.
   - Never export raw PII; rely on redaction/allowlist. Any export endpoint should enforce strict field selection and avoid sensitive data.
   - For cross-team sharing, prefer aggregated or masked datasets.

5. Idempotency and ordering
   - The worker uses outbox `id` as `audit_logs.id` with `ON CONFLICT DO NOTHING` to avoid duplicates.
   - Processing is ordered by outbox `created_at`; hash-chain grouping (e.g., per-tenant per-day) maintains verifiable sequence locally while enabling scale-out.
