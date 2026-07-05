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
import { customers } from "./customers";
import { currencyEnum, vehicles } from "./inventory";

export const salePaymentTypeEnum = pgEnum("sale_payment_type", [
  "cash",
  "bank_finance",
  "in_house_leasing",
]);

export const salesOrderStatusEnum = pgEnum("sales_order_status", [
  "draft",
  "confirmed",
  "completed",
  "cancelled",
]);

export const paymentScheduleStatusEnum = pgEnum("payment_schedule_status", [
  "pending",
  "paid",
  "overdue",
  "waived",
]);

export const financeCompanies = pgTable(
  "finance_companies",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    name: text("name").notNull(),
    code: text("code").notNull().unique(),
    contactPhone: text("contact_phone"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("finance_companies_is_active_idx").on(t.isActive)],
);

export const exchangeRates = pgTable(
  "exchange_rates",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    baseCurrency: currencyEnum("base_currency").notNull().default("USD"),
    targetCurrency: currencyEnum("target_currency").notNull(),
    rate: numeric("rate", { precision: 18, scale: 6 }).notNull(),
    effectiveDate: date("effective_date", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("exchange_rates_target_effective_idx").on(
      t.targetCurrency,
      t.effectiveDate,
    ),
    uniqueIndex("exchange_rates_pair_date_unique").on(
      t.baseCurrency,
      t.targetCurrency,
      t.effectiveDate,
    ),
  ],
);

export const salesOrders = pgTable(
  "sales_orders",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    orderNumber: text("order_number").notNull().unique(),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "restrict" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    salespersonId: text("salesperson_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    salePrice: numeric("sale_price", { precision: 18, scale: 2 }).notNull(),
    saleCurrency: currencyEnum("sale_currency").notNull().default("LAK"),
    exchangeRateUsed: numeric("exchange_rate_used", {
      precision: 18,
      scale: 6,
    }),
    paymentType: salePaymentTypeEnum("payment_type").notNull(),
    status: salesOrderStatusEnum("status").notNull().default("draft"),
    financeCompanyId: text("finance_company_id").references(
      () => financeCompanies.id,
      { onDelete: "set null" },
    ),
    financeApprovedAmount: numeric("finance_approved_amount", {
      precision: 18,
      scale: 2,
    }),
    financeTransferReceived: boolean("finance_transfer_received")
      .notNull()
      .default(false),
    financeTransferDate: date("finance_transfer_date", { mode: "date" }),
    downPayment: numeric("down_payment", { precision: 18, scale: 2 }),
    downPaymentCurrency: currencyEnum("down_payment_currency"),
    installmentMonths: integer("installment_months"),
    interestRatePercent: numeric("interest_rate_percent", {
      precision: 8,
      scale: 4,
    }),
    monthlyInstallment: numeric("monthly_installment", {
      precision: 18,
      scale: 2,
    }),
    notes: text("notes"),
    soldAt: timestamp("sold_at", {
      withTimezone: true,
      mode: "date",
    }),
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
    index("sales_orders_vehicle_id_idx").on(t.vehicleId),
    index("sales_orders_customer_id_idx").on(t.customerId),
    index("sales_orders_status_idx").on(t.status),
    index("sales_orders_payment_type_idx").on(t.paymentType),
    index("sales_orders_sold_at_idx").on(t.soldAt),
  ],
);

export const paymentSchedules = pgTable(
  "payment_schedules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    salesOrderId: text("sales_order_id")
      .notNull()
      .references(() => salesOrders.id, { onDelete: "cascade" }),
    installmentNumber: integer("installment_number").notNull(),
    dueDate: date("due_date", { mode: "date" }).notNull(),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    currency: currencyEnum("currency").notNull().default("LAK"),
    status: paymentScheduleStatusEnum("status").notNull().default("pending"),
    paidAt: timestamp("paid_at", {
      withTimezone: true,
      mode: "date",
    }),
    paidAmount: numeric("paid_amount", { precision: 18, scale: 2 }),
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
    uniqueIndex("payment_schedules_order_installment_unique").on(
      t.salesOrderId,
      t.installmentNumber,
    ),
    index("payment_schedules_due_date_idx").on(t.dueDate),
    index("payment_schedules_status_idx").on(t.status),
  ],
);
