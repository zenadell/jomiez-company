import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "jomiez_site"."enum_leads_country" AS ENUM('NG', 'GH', 'KE', 'ZA', 'GB', 'IE', 'US', 'CA');
  CREATE TYPE "jomiez_site"."enum_leads_status" AS ENUM('new', 'checked', 'ready', 'contacted', 'replied', 'won', 'lost', 'skipped', 'stopped');
  CREATE TYPE "jomiez_site"."enum_leads_source" AS ENUM('openstreetmap', 'manual', 'keeper');
  CREATE TYPE "jomiez_site"."enum_outreach_searches_kinds" AS ENUM('food', 'beauty', 'health', 'education', 'stay', 'shops', 'property', 'professional', 'fitness', 'auto', 'events', 'trades');
  CREATE TYPE "jomiez_site"."enum_outreach_searches_country" AS ENUM('NG', 'GH', 'KE', 'ZA', 'GB', 'IE', 'US', 'CA');
  CREATE TABLE "jomiez_site"."leads_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"what" varchar
  );
  
  CREATE TABLE "jomiez_site"."leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"kind" varchar,
  	"area" varchar,
  	"country" "jomiez_site"."enum_leads_country" DEFAULT 'NG',
  	"phone" varchar,
  	"email" varchar,
  	"website" varchar,
  	"address" varchar,
  	"socials" varchar,
  	"status" "jomiez_site"."enum_leads_status" DEFAULT 'new' NOT NULL,
  	"score" numeric,
  	"summary" varchar,
  	"review" varchar,
  	"messages_whatsapp" varchar,
  	"messages_sms" varchar,
  	"messages_email_subject" varchar,
  	"messages_email_body" varchar,
  	"messages_follow_up" boolean,
  	"messages_written_at" timestamp(3) with time zone,
  	"preview_slug" varchar,
  	"preview_content" jsonb,
  	"preview_made_at" timestamp(3) with time zone,
  	"preview_views" numeric DEFAULT 0,
  	"preview_last_viewed_at" timestamp(3) with time zone,
  	"contacted_at" timestamp(3) with time zone,
  	"follow_ups" numeric DEFAULT 0,
  	"notes" varchar,
  	"source" "jomiez_site"."enum_leads_source" DEFAULT 'manual',
  	"source_id" varchar,
  	"domain" varchar,
  	"check" jsonb,
  	"shot" varchar,
  	"stop_token" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "jomiez_site"."outreach_searches_kinds" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "jomiez_site"."enum_outreach_searches_kinds",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "jomiez_site"."outreach_searches" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"area" varchar NOT NULL,
  	"country" "jomiez_site"."enum_outreach_searches_country" DEFAULT 'NG' NOT NULL,
  	"on" boolean DEFAULT true
  );
  
  CREATE TABLE "jomiez_site"."outreach" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT false,
  	"daily_new" numeric DEFAULT 15,
  	"daily_ready" numeric DEFAULT 10,
  	"offer" varchar DEFAULT 'A fast, modern website that looks great on phones, shows up on Google and turns visitors into calls and WhatsApp messages. Designed and built by Jomiez, usually ready in about a week.',
  	"sender_name" varchar,
  	"sender_phone" varchar,
  	"address" varchar,
  	"previews" boolean DEFAULT true,
  	"preview_score" numeric DEFAULT 55,
  	"follow_up" boolean DEFAULT true,
  	"follow_up_days" numeric DEFAULT 4,
  	"gmail" varchar,
  	"daily_emails" numeric DEFAULT 20,
  	"gmail_password" varchar,
  	"gmail_password_hint" varchar,
  	"pagespeed_key" varchar,
  	"pagespeed_key_hint" varchar,
  	"weekly_post" boolean DEFAULT false,
  	"find_routine_id" integer,
  	"post_routine_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" ADD COLUMN "leads_id" integer;
  ALTER TABLE "jomiez_site"."leads_log" ADD CONSTRAINT "leads_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."outreach_searches_kinds" ADD CONSTRAINT "outreach_searches_kinds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "jomiez_site"."outreach_searches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."outreach_searches" ADD CONSTRAINT "outreach_searches_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."outreach"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."outreach" ADD CONSTRAINT "outreach_find_routine_id_agent_routines_id_fk" FOREIGN KEY ("find_routine_id") REFERENCES "jomiez_site"."agent_routines"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."outreach" ADD CONSTRAINT "outreach_post_routine_id_agent_routines_id_fk" FOREIGN KEY ("post_routine_id") REFERENCES "jomiez_site"."agent_routines"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "leads_log_order_idx" ON "jomiez_site"."leads_log" USING btree ("_order");
  CREATE INDEX "leads_log_parent_id_idx" ON "jomiez_site"."leads_log" USING btree ("_parent_id");
  CREATE INDEX "leads_status_idx" ON "jomiez_site"."leads" USING btree ("status");
  CREATE INDEX "leads_score_idx" ON "jomiez_site"."leads" USING btree ("score");
  CREATE UNIQUE INDEX "leads_preview_preview_slug_idx" ON "jomiez_site"."leads" USING btree ("preview_slug");
  CREATE INDEX "leads_source_id_idx" ON "jomiez_site"."leads" USING btree ("source_id");
  CREATE INDEX "leads_domain_idx" ON "jomiez_site"."leads" USING btree ("domain");
  CREATE INDEX "leads_stop_token_idx" ON "jomiez_site"."leads" USING btree ("stop_token");
  CREATE INDEX "leads_updated_at_idx" ON "jomiez_site"."leads" USING btree ("updated_at");
  CREATE INDEX "leads_created_at_idx" ON "jomiez_site"."leads" USING btree ("created_at");
  CREATE INDEX "outreach_searches_kinds_order_idx" ON "jomiez_site"."outreach_searches_kinds" USING btree ("order");
  CREATE INDEX "outreach_searches_kinds_parent_idx" ON "jomiez_site"."outreach_searches_kinds" USING btree ("parent_id");
  CREATE INDEX "outreach_searches_order_idx" ON "jomiez_site"."outreach_searches" USING btree ("_order");
  CREATE INDEX "outreach_searches_parent_id_idx" ON "jomiez_site"."outreach_searches" USING btree ("_parent_id");
  CREATE INDEX "outreach_find_routine_idx" ON "jomiez_site"."outreach" USING btree ("find_routine_id");
  CREATE INDEX "outreach_post_routine_idx" ON "jomiez_site"."outreach" USING btree ("post_routine_id");
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leads_fk" FOREIGN KEY ("leads_id") REFERENCES "jomiez_site"."leads"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_leads_id_idx" ON "jomiez_site"."payload_locked_documents_rels" USING btree ("leads_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "jomiez_site"."leads_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "jomiez_site"."leads" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "jomiez_site"."outreach_searches_kinds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "jomiez_site"."outreach_searches" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "jomiez_site"."outreach" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "jomiez_site"."leads_log" CASCADE;
  DROP TABLE "jomiez_site"."leads" CASCADE;
  DROP TABLE "jomiez_site"."outreach_searches_kinds" CASCADE;
  DROP TABLE "jomiez_site"."outreach_searches" CASCADE;
  DROP TABLE "jomiez_site"."outreach" CASCADE;
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_leads_fk";
  
  DROP INDEX "jomiez_site"."payload_locked_documents_rels_leads_id_idx";
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" DROP COLUMN "leads_id";
  DROP TYPE "jomiez_site"."enum_leads_country";
  DROP TYPE "jomiez_site"."enum_leads_status";
  DROP TYPE "jomiez_site"."enum_leads_source";
  DROP TYPE "jomiez_site"."enum_outreach_searches_kinds";
  DROP TYPE "jomiez_site"."enum_outreach_searches_country";`)
}
