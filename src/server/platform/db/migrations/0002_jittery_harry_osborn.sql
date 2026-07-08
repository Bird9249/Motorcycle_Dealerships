CREATE TYPE "public"."service_type" AS ENUM('oil_change', 'battery_check', 'electrical_check', 'general');--> statement-breakpoint
CREATE TYPE "public"."warranty_status" AS ENUM('active', 'expired', 'claimed', 'voided');--> statement-breakpoint
CREATE TYPE "public"."warranty_type" AS ENUM('vehicle', 'motor', 'battery');--> statement-breakpoint
CREATE TYPE "public"."payment_account_type" AS ENUM('cash', 'bank_transfer');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'bank_transfer');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."reconciliation_status" AS ENUM('open', 'balanced', 'discrepancy');--> statement-breakpoint
CREATE TABLE "service_records" (
	"id" text PRIMARY KEY NOT NULL,
	"vehicle_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"service_type" "service_type" NOT NULL,
	"odometer_km" integer,
	"description" text NOT NULL,
	"performed_at" timestamp with time zone NOT NULL,
	"performed_by" text NOT NULL,
	"battery_health_percent" integer,
	"battery_notes" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warranties" (
	"id" text PRIMARY KEY NOT NULL,
	"vehicle_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"sales_order_id" text NOT NULL,
	"warranty_type" "warranty_type" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"duration_months" integer NOT NULL,
	"battery_serial_number" text,
	"status" "warranty_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warranty_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"vehicle_months" integer DEFAULT 24 NOT NULL,
	"motor_months" integer DEFAULT 12 NOT NULL,
	"battery_months" integer DEFAULT 36 NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_reconciliations" (
	"id" text PRIMARY KEY NOT NULL,
	"reconciliation_date" date NOT NULL,
	"payment_account_id" text NOT NULL,
	"expected_amount" numeric(18, 2) NOT NULL,
	"actual_amount" numeric(18, 2),
	"difference" numeric(18, 2),
	"status" "reconciliation_status" DEFAULT 'open' NOT NULL,
	"notes" text,
	"reconciled_by" text,
	"reconciled_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "payment_account_type" NOT NULL,
	"bank_name" text,
	"account_number" text,
	"currency" "currency" DEFAULT 'LAK' NOT NULL,
	"qr_code_image_key" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_number" text NOT NULL,
	"sales_order_id" text,
	"payment_schedule_id" text,
	"payment_account_id" text NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"currency" "currency" DEFAULT 'LAK' NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"slip_image_key" text,
	"slip_verified" boolean DEFAULT false NOT NULL,
	"slip_verified_at" timestamp with time zone,
	"slip_verified_by" text,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"recorded_by" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "payments_payment_number_unique" UNIQUE("payment_number")
);
--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "sold_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_performed_by_user_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_reconciliations" ADD CONSTRAINT "daily_reconciliations_payment_account_id_payment_accounts_id_fk" FOREIGN KEY ("payment_account_id") REFERENCES "public"."payment_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_reconciliations" ADD CONSTRAINT "daily_reconciliations_reconciled_by_user_id_fk" FOREIGN KEY ("reconciled_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_schedule_id_payment_schedules_id_fk" FOREIGN KEY ("payment_schedule_id") REFERENCES "public"."payment_schedules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_account_id_payment_accounts_id_fk" FOREIGN KEY ("payment_account_id") REFERENCES "public"."payment_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_slip_verified_by_user_id_fk" FOREIGN KEY ("slip_verified_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "service_records_vehicle_id_idx" ON "service_records" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "service_records_customer_id_idx" ON "service_records" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "service_records_performed_at_idx" ON "service_records" USING btree ("performed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "warranties_sales_order_type_unique" ON "warranties" USING btree ("sales_order_id","warranty_type");--> statement-breakpoint
CREATE INDEX "warranties_vehicle_id_idx" ON "warranties" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "warranties_customer_id_idx" ON "warranties" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "warranties_status_idx" ON "warranties" USING btree ("status");--> statement-breakpoint
CREATE INDEX "warranties_end_date_idx" ON "warranties" USING btree ("end_date");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_reconciliations_date_account_unique" ON "daily_reconciliations" USING btree ("reconciliation_date","payment_account_id");--> statement-breakpoint
CREATE INDEX "daily_reconciliations_date_idx" ON "daily_reconciliations" USING btree ("reconciliation_date");--> statement-breakpoint
CREATE INDEX "payment_accounts_is_active_idx" ON "payment_accounts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "payment_accounts_display_order_idx" ON "payment_accounts" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "payments_sales_order_id_idx" ON "payments" USING btree ("sales_order_id");--> statement-breakpoint
CREATE INDEX "payments_payment_schedule_id_idx" ON "payments" USING btree ("payment_schedule_id");--> statement-breakpoint
CREATE INDEX "payments_payment_account_id_idx" ON "payments" USING btree ("payment_account_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_paid_at_idx" ON "payments" USING btree ("paid_at");