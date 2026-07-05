import { sql } from "drizzle-orm";
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

export const vehicleTypeEnum = pgEnum("vehicle_type", ["ice", "ev"]);

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "in_stock",
  "reserved",
  "sold",
  "in_service",
  "written_off",
]);

export const currencyEnum = pgEnum("currency", ["LAK", "THB", "USD"]);

export const vehicleDocumentTypeEnum = pgEnum("vehicle_document_type", [
  "import_invoice",
  "technical_inspection",
  "other",
]);

export const brands = pgTable("brands", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
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
});

export const models = pgTable(
  "models",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
    engineCc: integer("engine_cc"),
    batteryCapacityKwh: numeric("battery_capacity_kwh", {
      precision: 6,
      scale: 2,
    }),
    year: integer("year"),
    isActive: boolean("is_active").notNull().default(true),
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
    index("models_brand_id_idx").on(t.brandId),
    uniqueIndex("models_brand_id_name_unique").on(t.brandId, t.name),
  ],
);

export const colors = pgTable("colors", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull().unique(),
  hexCode: text("hex_code"),
  isActive: boolean("is_active").notNull().default(true),
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
});

export const vehicles = pgTable(
  "vehicles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    modelId: text("model_id")
      .notNull()
      .references(() => models.id, { onDelete: "restrict" }),
    colorId: text("color_id")
      .notNull()
      .references(() => colors.id, { onDelete: "restrict" }),
    chassisNumber: text("chassis_number"),
    engineNumber: text("engine_number"),
    batterySerialNumber: text("battery_serial_number"),
    batteryCapacityKwh: numeric("battery_capacity_kwh", {
      precision: 6,
      scale: 2,
    }),
    status: vehicleStatusEnum("status").notNull().default("in_stock"),
    soldAt: timestamp("sold_at", {
      withTimezone: true,
      mode: "date",
    }),
    costPrice: numeric("cost_price", { precision: 18, scale: 2 }).notNull(),
    costCurrency: currencyEnum("cost_currency").notNull().default("LAK"),
    listPrice: numeric("list_price", { precision: 18, scale: 2 }).notNull(),
    listCurrency: currencyEnum("list_currency").notNull().default("LAK"),
    importInvoiceReceived: boolean("import_invoice_received")
      .notNull()
      .default(false),
    technicalInspectionReceived: boolean("technical_inspection_received")
      .notNull()
      .default(false),
    registrationReady: boolean("registration_ready").notNull().default(false),
    importDate: date("import_date", { mode: "date" }),
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
    index("vehicles_model_id_idx").on(t.modelId),
    index("vehicles_status_idx").on(t.status),
    uniqueIndex("vehicles_chassis_number_unique")
      .on(t.chassisNumber)
      .where(sql`${t.chassisNumber} is not null`),
    uniqueIndex("vehicles_engine_number_unique")
      .on(t.engineNumber)
      .where(sql`${t.engineNumber} is not null`),
    uniqueIndex("vehicles_battery_serial_number_unique")
      .on(t.batterySerialNumber)
      .where(sql`${t.batterySerialNumber} is not null`),
  ],
);

export const vehicleDocuments = pgTable(
  "vehicle_documents",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    documentType: vehicleDocumentTypeEnum("document_type").notNull(),
    fileKey: text("file_key").notNull(),
    fileName: text("file_name").notNull(),
    uploadedBy: text("uploaded_by").references(() => user.id, {
      onDelete: "set null",
    }),
    uploadedAt: timestamp("uploaded_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("vehicle_documents_vehicle_id_idx").on(t.vehicleId)],
);
