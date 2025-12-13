import type { AuditEvent } from "../audit.types";

// AuditPolicy implementation (infra) – pure logic, no DB/HTTP references.
// Responsibility:
// - Enforce an allowlist for entity snapshots (before/after) based on entityType
// - Mask sensitive fields (password, token, secret, PII) anywhere in the payload
//
// Extensibility:
// - Add a new entity type by extending ALLOWLIST_BY_ENTITY below
// - Add new masking rules by extending SENSITIVE_KEY_PATTERNS or custom maskers
//
// Testing focus:
// - Redaction removes fields not in allowlist for each entityType
// - Sensitive keys are masked recursively (including nested objects/arrays)
// - Original input object is not mutated (defensive clone)
// - Unknown entityType results in before/after being dropped or fully masked

const SENSITIVE_KEY_PATTERNS: RegExp[] = [
  /password/i,
  /token/i,
  /secret/i,
  /credential/i,
  /apiKey/i,
  /accessKey/i,
  /privateKey/i,
  /ssn|nin|nationalId/i,
  /email/i, // treat as PII for audit storage; visible in logs could be restricted
  /phone/i,
  /phoneNumber/i,
];

// Allowlist of fields to keep for snapshots (before/after) per entity type.
// Any fields not listed here will be removed from snapshots before persisting to outbox.
const ALLOWLIST_BY_ENTITY: Record<string, readonly string[]> = {
  // Example presets – extend as your domain grows
  user: [
    "id",
    "name",
    "email",
    "phoneNumber",
    "image",
    "banned",
    "banReason",
    "banExpires",
    "createdAt",
    "updatedAt",
  ],
  role: ["id", "name", "description", "permissions"],
};

const REDACTED = "[REDACTED]" as const;

function maskPrimitive(value: unknown): unknown {
  if (typeof value === "string") {
    // Preserve minimal shape for visibility while masking content
    if (value.length <= 4) return REDACTED;
    return `${value.slice(0, 2)}${"*".repeat(Math.max(1, value.length - 4))}${value.slice(
      -2,
    )}`;
  }
  if (typeof value === "number") return Number.NaN; // numbers considered sensitive are removed
  if (typeof value === "boolean") return REDACTED;
  if (value instanceof Date) return new Date(0);
  // Fallback for unknown types
  return REDACTED;
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((re) => re.test(key));
}

function deepClone<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((v) => deepClone(v)) as unknown as T;
  }
  if (input && typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[k] = deepClone(v);
    }
    return out as T;
  }
  return input;
}

function deepMask(input: unknown, ancestors: string[] = []): unknown {
  if (Array.isArray(input)) {
    return input.map((v) => deepMask(v, ancestors));
  }
  if (input && typeof input === "object") {
    const output: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (isSensitiveKey(k)) {
        output[k] = maskPrimitive(v);
      } else {
        output[k] = deepMask(v, [...ancestors, k]);
      }
    }
    return output;
  }
  return input;
}

function pickAllowlistedFields(
  snapshot: unknown,
  allowlist: readonly string[],
): unknown {
  if (!snapshot || typeof snapshot !== "object") return undefined;
  const picked: Record<string, unknown> = {};
  for (const field of allowlist) {
    if (field in (snapshot as Record<string, unknown>)) {
      picked[field] = (snapshot as Record<string, unknown>)[field];
    }
  }
  return picked;
}

function redactSnapshotForEntity(
  entityType: string | undefined,
  snapshot: unknown,
): unknown {
  if (!snapshot) return snapshot;
  const allowlist = entityType ? ALLOWLIST_BY_ENTITY[entityType] : undefined;
  if (!allowlist) {
    // Unknown entity: drop snapshot to avoid leaking fields
    return undefined;
  }
  const picked = pickAllowlistedFields(snapshot, allowlist);
  return deepMask(picked);
}

export class AuditPolicy {
  redact(ev: AuditEvent): AuditEvent {
    const copy = deepClone(ev);

    // Always mask meta recursively; meta may contain various ad-hoc info
    if (copy.meta) {
      copy.meta = deepMask(copy.meta) as Record<string, unknown>;
    }

    // Redact before/after snapshots by allowlist per entity type and then mask
    copy.before = redactSnapshotForEntity(copy.entityType, copy.before);
    copy.after = redactSnapshotForEntity(copy.entityType, copy.after);

    // Mask top-level potentially sensitive fields (e.g., path could include IDs; userAgent/IP kept as is)
    // If you decide to treat email/ip/userAgent as PII, add their keys to SENSITIVE_KEY_PATTERNS.

    return copy;
  }
}

export const auditPolicy = new AuditPolicy();

// How to extend allowlist:
// - Add a new entry in ALLOWLIST_BY_ENTITY, e.g.,
//   order: ["id", "status", "total", "currency"]
// - Ensure unit tests cover before/after redaction for this entity
//
// How to extend masking rules:
// - Add a regex to SENSITIVE_KEY_PATTERNS for the new sensitive key
// - Or customize maskPrimitive to handle new types/patterns
// - Add tests to verify nested objects/arrays are masked correctly
//
// Suggested tests:
// - Redacts unknown entityType snapshots entirely (before/after undefined)
// - Keeps only allowlisted fields for known entityType
// - Masks sensitive keys at any depth in objects and arrays
// - Does not mutate the original AuditEvent instance
// - Handles null/undefined snapshots safely
