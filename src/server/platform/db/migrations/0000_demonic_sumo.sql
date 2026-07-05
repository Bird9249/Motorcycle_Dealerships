CREATE TYPE "public"."currency" AS ENUM('LAK', 'THB', 'USD');--> statement-breakpoint
CREATE TYPE "public"."vehicle_document_type" AS ENUM('import_invoice', 'technical_inspection', 'other');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('in_stock', 'reserved', 'sold', 'in_service', 'written_off');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('ice', 'ev');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"request_id" text,
	"trace_id" text,
	"tenant_id" text,
	"actor_id" text,
	"actor_role" text,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"result" text DEFAULT 'success',
	"error" text,
	"ip" text,
	"user_agent" text,
	"path" text,
	"method" text,
	"before" jsonb,
	"after" jsonb,
	"meta" jsonb,
	"prev_hash" text,
	"hash" text
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"phone_number" text,
	"phone_number_verified" boolean,
	"image" text,
	"role" text,
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" date,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "colors" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"hex_code" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "colors_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"name" text NOT NULL,
	"vehicle_type" "vehicle_type" NOT NULL,
	"engine_cc" integer,
	"battery_capacity_kwh" numeric(6, 2),
	"year" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"vehicle_id" text NOT NULL,
	"document_type" "vehicle_document_type" NOT NULL,
	"file_key" text NOT NULL,
	"file_name" text NOT NULL,
	"uploaded_by" text,
	"uploaded_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" text PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"color_id" text NOT NULL,
	"chassis_number" text,
	"engine_number" text,
	"battery_serial_number" text,
	"battery_capacity_kwh" numeric(6, 2),
	"status" "vehicle_status" DEFAULT 'in_stock' NOT NULL,
	"cost_price" numeric(18, 2) NOT NULL,
	"cost_currency" "currency" DEFAULT 'LAK' NOT NULL,
	"list_price" numeric(18, 2) NOT NULL,
	"list_currency" "currency" DEFAULT 'LAK' NOT NULL,
	"import_invoice_received" boolean DEFAULT false NOT NULL,
	"technical_inspection_received" boolean DEFAULT false NOT NULL,
	"registration_ready" boolean DEFAULT false NOT NULL,
	"import_date" date,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aggregate_type" text NOT NULL,
	"aggregate_id" text NOT NULL,
	"message_type" text NOT NULL,
	"segment" text,
	"concurrency" text DEFAULT 'sequential' NOT NULL,
	"payload" jsonb NOT NULL,
	"metadata" jsonb,
	"locked_until" timestamp with time zone DEFAULT to_timestamp(0) NOT NULL,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"processed_at" timestamp with time zone,
	"abandoned_at" timestamp with time zone,
	"started_attempts" smallint DEFAULT 0 NOT NULL,
	"finished_attempts" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rbac_role" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"permissions" varchar[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rbac_user_role" (
	"user_id" text NOT NULL,
	"role_id" text NOT NULL,
	CONSTRAINT "rbac_user_role_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_color_id_colors_id_fk" FOREIGN KEY ("color_id") REFERENCES "public"."colors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac_user_role" ADD CONSTRAINT "rbac_user_role_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac_user_role" ADD CONSTRAINT "rbac_user_role_role_id_rbac_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."rbac_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_by_time" ON "audit_logs" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "audit_logs_by_tenant_time" ON "audit_logs" USING btree ("tenant_id","occurred_at");--> statement-breakpoint
CREATE INDEX "audit_logs_by_entity" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_by_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "models_brand_id_idx" ON "models" USING btree ("brand_id");--> statement-breakpoint
CREATE UNIQUE INDEX "models_brand_id_name_unique" ON "models" USING btree ("brand_id","name");--> statement-breakpoint
CREATE INDEX "vehicle_documents_vehicle_id_idx" ON "vehicle_documents" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "vehicles_model_id_idx" ON "vehicles" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "vehicles_status_idx" ON "vehicles" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_chassis_number_unique" ON "vehicles" USING btree ("chassis_number") WHERE "vehicles"."chassis_number" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_engine_number_unique" ON "vehicles" USING btree ("engine_number") WHERE "vehicles"."engine_number" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_battery_serial_number_unique" ON "vehicles" USING btree ("battery_serial_number") WHERE "vehicles"."battery_serial_number" is not null;--> statement-breakpoint
CREATE INDEX "outbox_aggregate_type_aggregate_id" ON "outbox" USING btree ("aggregate_type","aggregate_id");--> statement-breakpoint
CREATE INDEX "outbox_created_at" ON "outbox" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "outbox_processed_at" ON "outbox" USING btree ("processed_at");--> statement-breakpoint
CREATE INDEX "outbox_locked_until" ON "outbox" USING btree ("locked_until");