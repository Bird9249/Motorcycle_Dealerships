---
name: drizzle-orm
description: Defines TypeScript schemas, runs Drizzle Kit migrations (generate, migrate, push, pull), and queries data with SQL-like or relational APIs across PostgreSQL, MySQL, SQLite, libSQL/Turso, and Bun SQL. Use when the user mentions Drizzle, drizzle-orm, drizzle-kit, schema definitions, migrations, or type-safe SQL in TypeScript.
---

# Drizzle ORM

**Canonical reference:** [orm.drizzle.team/docs](https://orm.drizzle.team/docs) — use for exact APIs, dialect differences, and version-specific behavior.

Drizzle is a **headless** TypeScript ORM: schema in TS, **SQL-like** query builder, optional **relational** queries (`db.query`), and **Drizzle Kit** for migrations. It is **dialect-specific** — import from `drizzle-orm/pg-core`, `mysql-core`, or `sqlite-core` (not a generic “one table API”).

---

## Packages

| Package | Role |
|--------|------|
| `drizzle-orm` | Schema + query runtime |
| `drizzle-kit` | CLI: `generate`, `migrate`, `push`, `pull`, `export`, `studio`, etc. |

Install drivers as needed: `pg`, `postgres`, `@libsql/client`, `better-sqlite3`, etc. With **Bun**, prefer `bun add` / `bunx drizzle-kit` per project conventions.

---

## Mental model

1. **Schema (TS)** — source of truth for types and (with Kit) migration diffs.
2. **`drizzle(client | url, options?)`** — database instance; pass **`schema`** when using relational `db.query.*`.
3. **Two ways to read data:**
   - **SQL-like:** `db.select().from(table).where(...)` — full SQL control.
   - **Relational:** `db.query.users.findMany({ with: { posts: true } })` — nested result, typically **one SQL statement** (see [Relational Queries](https://orm.drizzle.team/docs/rqb)).

---

## Schema basics

- Tables are **dialect-specific**: `pgTable`, `mysqlTable`, `sqliteTable`, etc.
- **Export every table/enum/view** used in migrations so Drizzle Kit can import them.
- **TS property name vs DB column name:** use `columnName: type('snake_case')` or global **`casing: 'snake_case'`** on `drizzle()` so `firstName` maps to `first_name`.
- **Self-referencing / circular FKs:** use `references((): AnyPgColumn => users.id)` (or dialect `AnyMySqlColumn` / `AnySQLiteColumn`) to avoid TDZ issues.
- **`relations()`** are **app-level only** (for `db.query`); they do **not** create FKs. Use `.references(() => ...)` on columns for DB constraints.
- **PostgreSQL `pgSchema('name')`** for non-`public` schemas; MySQL “schema” ≈ database (Kit limitations differ — see docs).

Minimal PostgreSQL example:

```ts
import { pgTable, integer, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 256 }).notNull().unique(),
});
```

Indexes / constraints: third argument to `pgTable(..., (t) => [ uniqueIndex('...').on(t.col) ])`.

---

## Database connection (drivers)

Pick the import that matches the **driver** and **dialect**:

| Use case | Typical import |
|----------|----------------|
| Node `pg` Pool | `drizzle-orm/node-postgres` — `drizzle({ client: pool })` or `drizzle(process.env.DATABASE_URL)` |
| `postgres.js` | `drizzle-orm/postgres-js` |
| **Bun + PostgreSQL** | `drizzle-orm/bun-sql` — `drizzle(process.env.DATABASE_URL)` or `drizzle({ client: new SQL(url) })` ([docs](https://orm.drizzle.team/docs/connect-bun-sql)) |
| libSQL / Turso | `drizzle-orm/libsql` (+ `@libsql/client`) |
| SQLite file | `drizzle-orm/better-sqlite3` |

Pass **`{ schema }`** when using relational queries:

```ts
import * as schema from "./schema";
const db = drizzle(client, { schema });
```

Optional: **`casing: 'snake_case'`** in constructor options for column name mapping.

---

## SQL-like queries (overview)

Imports: `eq`, `and`, `or`, `sql`, … from **`drizzle-orm`**.

```ts
import { eq } from "drizzle-orm";

await db.select().from(users).where(eq(users.id, 1));

await db.select({ id: users.id, label: sql<string>`lower(${users.name})` }).from(users);

await db.insert(users).values({ email: "a@b.com" }).returning();

await db.update(users).set({ email: "new@b.com" }).where(eq(users.id, 1));

await db.delete(users).where(eq(users.id, 1));
```

- Drizzle expands **explicit column lists** (not `SELECT *`) for predictable row shapes.
- For dynamic filters, use **`.$dynamic()`** on the query builder where documented.
- Raw fragments: **`sql\`...\``** — use generics (`sql<string>`) carefully; runtime types are not auto-cast.

Details: [Select](https://orm.drizzle.team/docs/select), [Insert](https://orm.drizzle.team/docs/insert), [Update](https://orm.drizzle.team/docs/update), [Delete](https://orm.drizzle.team/docs/delete), [Filters](https://orm.drizzle.team/docs/operators), [sql template](https://orm.drizzle.team/docs/sql).

---

## Relational queries

1. Define **`relations(table, ({ one, many }) => ({ ... }))`** linking tables.
2. Instantiate **`drizzle(client, { schema })`** with the schema object that exports tables + relations.
3. Use **`db.query.<table>.findMany` / `findFirst`** with **`with: { relationName: true | { ... } }`**.

Foreign keys vs relations: FKs enforce DB integrity; relations power **nested loading**. You may use either or both.

See [Relations](https://orm.drizzle.team/docs/relations) and [Relational Queries (RQB)](https://orm.drizzle.team/docs/rqb).

---

## Drizzle Kit & migrations

Config file: **`drizzle.config.ts`** — `defineConfig` from `drizzle-kit` with **`dialect`**, **`schema`** path(s), **`out`** for generated SQL, and **`dbCredentials`** as needed.

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});
```

**Workflow choices (from [Migrations](https://orm.drizzle.team/docs/migrations)):**

| Goal | Commands |
|------|----------|
| TS schema → SQL migration files | `drizzle-kit generate` |
| Apply migrations (CLI) | `drizzle-kit migrate` |
| Prototype / push schema without SQL files | `drizzle-kit push` |
| DB → pull TS schema | `drizzle-kit pull` |
| App startup: run migrations in code | `migrate(db)` from `drizzle-orm/<driver>/migrator` |
| Export SQL for external tools (e.g. Atlas) | `drizzle-kit export` |

Migrations folder layout and `migrate()` usage are driver-specific — follow the **Get started** page for your database.

Multi-file schema: point `schema` at a **folder**; export all models.

---

## drizzle.config.ts extras (common)

- **`migrations.table` / `schema`** — custom journal table or schema for migrations.
- **`schemaFilter` / `tablesFilter`** — limit introspection / push scope.
- Multiple configs: `bunx drizzle-kit generate --config=drizzle-dev.config.ts`.

Full option list: [drizzle.config.ts](https://orm.drizzle.team/docs/drizzle-config-file).

---

## Transactions & batch

Use **`db.transaction(async (tx) => { ... })`** for atomic units. Prefer passing **`tx`** instead of `db` inside the callback.

**Batch** APIs exist for sending multiple statements efficiently — see [Transactions](https://orm.drizzle.team/docs/transactions) and [Batch](https://orm.drizzle.team/docs/batch).

---

## Tooling & ecosystem (pointers)

- **Drizzle Studio:** local UI to browse data — `drizzle-kit studio` (see Kit docs).
- **Seed:** `drizzle-seed` package — [Seeding](https://orm.drizzle.team/docs/seed-overview).
- **Validators:** `drizzle-zod` and others — [Validations](https://orm.drizzle.team/docs/zod); newer releases may consolidate packages — check docs for your Drizzle version.
- **ESLint:** `eslint-plugin-drizzle` — [Extensions](https://orm.drizzle.team/docs/eslint-plugin).
- **v1.0 / beta:** relational query APIs and Kit behavior may differ from 0.x — confirm **upgrade guides** on the site if the project uses beta.

---

## Agent checklist

When editing Drizzle code:

1. Confirm **dialect** (`pg-core` vs `mysql-core` vs `sqlite-core`).
2. Ensure schema **exports** match what **drizzle-kit** loads.
3. Match **driver** import (`node-postgres`, `postgres-js`, `bun-sql`, `libsql`, …) to deployment.
4. Prefer **parameterized** conditions (`eq`, `inArray`, …) over string-concatenated SQL.
5. After schema changes, choose **generate + migrate** vs **push** intentionally (team vs solo, CI vs local).

For behavior not covered here, open the relevant page under [Documentation](https://orm.drizzle.team/docs/overview).
