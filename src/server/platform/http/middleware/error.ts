import { buildAuditEvent } from "@/server/modules/audit/http/helpers";
import { appendAudit } from "@/server/modules/audit/services/append-audit";
import { db } from "@/server/platform/db/client";
import type { HonoContext } from "@/server/shared/types";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

const AUDIT_FAILURE_PATHS: ReadonlyArray<string> = [
  "/api/users",
  "/api/rbac",
  "/api/auth",
];

function shouldAuditFailure(path: string): boolean {
  return AUDIT_FAILURE_PATHS.some((p) => path.startsWith(p));
}

function mapFailureAction(status: number): string {
  if (status === 400) return "VALIDATION.FAILED";
  if (status === 403) return "RBAC.DENIED";
  return "HTTP.REQUEST.FAILED";
}

function sanitizeErrorMessage(e: unknown): string {
  const raw =
    e && typeof e === "object" && "message" in e
      ? ((e as { message?: string }).message ?? "Error")
      : typeof e === "string"
        ? e
        : "Error";
  const msg = String(raw).replace(/\s+/g, " ").slice(0, 200);
  return msg;
}

export const errorHandler = async (
  c: Context<HonoContext>,
  next: () => Promise<void>,
) => {
  try {
    await next();
  } catch (e: unknown) {
    const status = e instanceof HTTPException ? e.status : 500;
    const message =
      e && typeof e === "object" && "message" in e
        ? ((e as { message?: string }).message ?? "Internal Server Error")
        : "Internal Server Error";
    try {
      const path = c.req.path;
      if (shouldAuditFailure(path)) {
        const action = mapFailureAction(status);
        const error = sanitizeErrorMessage(e);
        await appendAudit(db, [
          buildAuditEvent(c as unknown as Context, {
            action,
            result: "failed",
            error,
          }),
        ]);
      }
    } catch {
      // Best-effort audit on failure; ignore secondary errors
    }
    return c.json({ error: message }, status);
  }
};
