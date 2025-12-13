import type { auth } from "@/server/modules/auth/better-auth";
import type * as schema from "@/server/platform/db/schema";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { BunSQLQueryResultHKT } from "drizzle-orm/bun-sql";
import type { PgTransaction } from "drizzle-orm/pg-core";

export type DbTransaction = PgTransaction<
  BunSQLQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;
export type Brand<T, B extends string> = T & { readonly __brand: B };
export type Id = Brand<string, "Id">;

export type HonoContext = {
  Variables: {
    user: (typeof auth.$Infer.Session.user & { role: string }) | null;
    session: typeof auth.$Infer.Session.session | null;
    permissions: string[];
    requestId?: string;
    traceId?: string;
    ip?: string;
    userAgent?: string;
    tenantId?: string;
    actorId?: string;
    actorRole?: string;
    db: DbTransaction;
  };
};
