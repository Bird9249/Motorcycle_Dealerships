import type { auth } from "@/modules/auth/domain/better-auth";
import type { DbClient } from "@/server/platform/db/client";
import type * as schema from "@/server/platform/db/schema";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { BunSQLQueryResultHKT } from "drizzle-orm/bun-sql";

export type DbTransaction =
  | PgTransaction<
      BunSQLQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >
  | DbClient;

export type Brand<T, B extends string> = T & { readonly __brand: B };
export type Id = Brand<string, "Id">;

export type AuthUser = typeof auth.$Infer.Session.user & { role: string };
export type AuthSession = typeof auth.$Infer.Session.session;
