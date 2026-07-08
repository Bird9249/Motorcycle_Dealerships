import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { user } from "./auth";
import { customers } from "./customers";
import { vehicles } from "./inventory";
import { salesOrders } from "./sales";

export const serviceTypeEnum = pgEnum("service_type", [
  "oil_change",
  "battery_check",
  "electrical_check",
  "general",
]);

export const warrantyTypeEnum = pgEnum("warranty_type", [
  "vehicle",
  "motor",
  "battery",
]);

export const warrantyStatusEnum = pgEnum("warranty_status", [
  "active",
  "expired",
  "claimed",
  "voided",
]);

export const warranties = pgTable(
  "warranties",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "restrict" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    salesOrderId: text("sales_order_id")
      .notNull()
      .references(() => salesOrders.id, { onDelete: "restrict" }),
    warrantyType: warrantyTypeEnum("warranty_type").notNull(),
    startDate: date("start_date", { mode: "date" }).notNull(),
    endDate: date("end_date", { mode: "date" }).notNull(),
    durationMonths: integer("duration_months").notNull(),
    batterySerialNumber: text("battery_serial_number"),
    status: warrantyStatusEnum("status").notNull().default("active"),
    notes: text("notes"),
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
    uniqueIndex("warranties_sales_order_type_unique").on(
      t.salesOrderId,
      t.warrantyType,
    ),
    index("warranties_vehicle_id_idx").on(t.vehicleId),
    index("warranties_customer_id_idx").on(t.customerId),
    index("warranties_status_idx").on(t.status),
    index("warranties_end_date_idx").on(t.endDate),
  ],
);

export const serviceRecords = pgTable(
  "service_records",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "restrict" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    serviceType: serviceTypeEnum("service_type").notNull(),
    odometerKm: integer("odometer_km"),
    description: text("description").notNull(),
    performedAt: timestamp("performed_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    performedBy: text("performed_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    batteryHealthPercent: integer("battery_health_percent"),
    batteryNotes: text("battery_notes"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("service_records_vehicle_id_idx").on(t.vehicleId),
    index("service_records_customer_id_idx").on(t.customerId),
    index("service_records_performed_at_idx").on(t.performedAt),
  ],
);

/** Singleton row — id is always `default`. */
export const warrantySettings = pgTable("warranty_settings", {
  id: text("id").primaryKey().default("default"),
  vehicleMonths: integer("vehicle_months").notNull().default(24),
  motorMonths: integer("motor_months").notNull().default(12),
  batteryMonths: integer("battery_months").notNull().default(36),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .$defaultFn(() => new Date()),
});
