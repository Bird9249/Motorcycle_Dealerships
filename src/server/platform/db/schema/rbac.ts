import { pgTable, primaryKey, text, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const role = pgTable("rbac_role", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  permissions: varchar("permissions").array().notNull().default([]),
});

export const userRole = pgTable(
  "rbac_user_role",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => role.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({
      columns: [t.userId, t.roleId],
      name: "rbac_user_role_pk",
    }),
  ],
);
