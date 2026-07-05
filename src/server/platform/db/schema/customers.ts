import {
  index,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { user } from "./auth";

/** Minimal customers table — full CRM UI in after-sales Phase 1. */
export const customers = pgTable(
  "customers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    phoneSecondary: text("phone_secondary"),
    village: text("village"),
    district: text("district"),
    province: text("province"),
    idCardNumber: text("id_card_number"),
    householdBookNumber: text("household_book_number"),
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("customers_phone_idx").on(t.phone),
    index("customers_full_name_idx").on(t.fullName),
  ],
);
