CREATE TYPE "public"."payment_schedule_status" AS ENUM('pending', 'paid', 'overdue', 'waived');--> statement-breakpoint
CREATE TYPE "public"."sale_payment_type" AS ENUM('cash', 'bank_finance', 'in_house_leasing');--> statement-breakpoint
CREATE TYPE "public"."sales_order_status" AS ENUM('draft', 'confirmed', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"phone_secondary" text,
	"village" text,
	"district" text,
	"province" text,
	"id_card_number" text,
	"household_book_number" text,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" text PRIMARY KEY NOT NULL,
	"base_currency" "currency" DEFAULT 'USD' NOT NULL,
	"target_currency" "currency" NOT NULL,
	"rate" numeric(18, 6) NOT NULL,
	"effective_date" date NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_companies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"contact_phone" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "finance_companies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "payment_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"sales_order_id" text NOT NULL,
	"installment_number" integer NOT NULL,
	"due_date" date NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"currency" "currency" DEFAULT 'LAK' NOT NULL,
	"status" "payment_schedule_status" DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"paid_amount" numeric(18, 2),
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"vehicle_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"salesperson_id" text NOT NULL,
	"sale_price" numeric(18, 2) NOT NULL,
	"sale_currency" "currency" DEFAULT 'LAK' NOT NULL,
	"exchange_rate_used" numeric(18, 6),
	"payment_type" "sale_payment_type" NOT NULL,
	"status" "sales_order_status" DEFAULT 'draft' NOT NULL,
	"finance_company_id" text,
	"finance_approved_amount" numeric(18, 2),
	"finance_transfer_received" boolean DEFAULT false NOT NULL,
	"finance_transfer_date" date,
	"down_payment" numeric(18, 2),
	"down_payment_currency" "currency",
	"installment_months" integer,
	"interest_rate_percent" numeric(8, 4),
	"monthly_installment" numeric(18, 2),
	"notes" text,
	"sold_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "sales_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_salesperson_id_user_id_fk" FOREIGN KEY ("salesperson_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_finance_company_id_finance_companies_id_fk" FOREIGN KEY ("finance_company_id") REFERENCES "public"."finance_companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customers_phone_idx" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "customers_full_name_idx" ON "customers" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "exchange_rates_target_effective_idx" ON "exchange_rates" USING btree ("target_currency","effective_date");--> statement-breakpoint
CREATE UNIQUE INDEX "exchange_rates_pair_date_unique" ON "exchange_rates" USING btree ("base_currency","target_currency","effective_date");--> statement-breakpoint
CREATE INDEX "finance_companies_is_active_idx" ON "finance_companies" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_schedules_order_installment_unique" ON "payment_schedules" USING btree ("sales_order_id","installment_number");--> statement-breakpoint
CREATE INDEX "payment_schedules_due_date_idx" ON "payment_schedules" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "payment_schedules_status_idx" ON "payment_schedules" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sales_orders_vehicle_id_idx" ON "sales_orders" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "sales_orders_customer_id_idx" ON "sales_orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "sales_orders_status_idx" ON "sales_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sales_orders_payment_type_idx" ON "sales_orders" USING btree ("payment_type");--> statement-breakpoint
CREATE INDEX "sales_orders_sold_at_idx" ON "sales_orders" USING btree ("sold_at");