import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { user } from "./auth";
import { currencyEnum } from "./inventory";
import { paymentSchedules, salesOrders } from "./sales";

export const paymentAccountTypeEnum = pgEnum("payment_account_type", [
  "cash",
  "bank_transfer",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "bank_transfer",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "verified",
  "rejected",
]);

export const reconciliationStatusEnum = pgEnum("reconciliation_status", [
  "open",
  "balanced",
  "discrepancy",
]);

export const paymentAccounts = pgTable(
  "payment_accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    name: text("name").notNull(),
    type: paymentAccountTypeEnum("type").notNull(),
    bankName: text("bank_name"),
    accountNumber: text("account_number"),
    currency: currencyEnum("currency").notNull().default("LAK"),
    qrCodeImageKey: text("qr_code_image_key"),
    isActive: boolean("is_active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
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
    index("payment_accounts_is_active_idx").on(t.isActive),
    index("payment_accounts_display_order_idx").on(t.displayOrder),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    paymentNumber: text("payment_number").notNull().unique(),
    salesOrderId: text("sales_order_id").references(() => salesOrders.id, {
      onDelete: "restrict",
    }),
    paymentScheduleId: text("payment_schedule_id").references(
      () => paymentSchedules.id,
      { onDelete: "restrict" },
    ),
    paymentAccountId: text("payment_account_id")
      .notNull()
      .references(() => paymentAccounts.id, { onDelete: "restrict" }),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    currency: currencyEnum("currency").notNull().default("LAK"),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paidAt: timestamp("paid_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    slipImageKey: text("slip_image_key"),
    slipVerified: boolean("slip_verified").notNull().default(false),
    slipVerifiedAt: timestamp("slip_verified_at", {
      withTimezone: true,
      mode: "date",
    }),
    slipVerifiedBy: text("slip_verified_by").references(() => user.id, {
      onDelete: "set null",
    }),
    status: paymentStatusEnum("status").notNull().default("pending"),
    notes: text("notes"),
    recordedBy: text("recorded_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
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
    index("payments_sales_order_id_idx").on(t.salesOrderId),
    index("payments_payment_schedule_id_idx").on(t.paymentScheduleId),
    index("payments_payment_account_id_idx").on(t.paymentAccountId),
    index("payments_status_idx").on(t.status),
    index("payments_paid_at_idx").on(t.paidAt),
  ],
);

export const dailyReconciliations = pgTable(
  "daily_reconciliations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    reconciliationDate: date("reconciliation_date", {
      mode: "date",
    }).notNull(),
    paymentAccountId: text("payment_account_id")
      .notNull()
      .references(() => paymentAccounts.id, { onDelete: "restrict" }),
    expectedAmount: numeric("expected_amount", {
      precision: 18,
      scale: 2,
    }).notNull(),
    actualAmount: numeric("actual_amount", { precision: 18, scale: 2 }),
    difference: numeric("difference", { precision: 18, scale: 2 }),
    status: reconciliationStatusEnum("status").notNull().default("open"),
    notes: text("notes"),
    reconciledBy: text("reconciled_by").references(() => user.id, {
      onDelete: "set null",
    }),
    reconciledAt: timestamp("reconciled_at", {
      withTimezone: true,
      mode: "date",
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
    uniqueIndex("daily_reconciliations_date_account_unique").on(
      t.reconciliationDate,
      t.paymentAccountId,
    ),
    index("daily_reconciliations_date_idx").on(t.reconciliationDate),
  ],
);
