import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "jomiez_site"."enum_leads_preview_kind" AS ENUM('built-in', 'aethron');
  CREATE TYPE "jomiez_site"."enum_site_templates_source" AS ENUM('free', 'paid');
  CREATE TYPE "jomiez_site"."enum_site_templates_platform" AS ENUM('framer', 'webflow', 'other');
  ALTER TYPE "jomiez_site"."enum_access_keys_scopes" ADD VALUE 'runner';
  CREATE TABLE "jomiez_site"."site_templates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"source" "jomiez_site"."enum_site_templates_source" DEFAULT 'free',
  	"platform" "jomiez_site"."enum_site_templates_platform" DEFAULT 'framer',
  	"enabled" boolean DEFAULT true,
  	"style" varchar,
  	"page" varchar,
  	"licence" varchar,
  	"licence_url" varchar,
  	"project" varchar,
  	"prepared" boolean DEFAULT false,
  	"pages" jsonb,
  	"uses" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "jomiez_site"."site_templates_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "jomiez_site"."leads" ADD COLUMN "preview_kind" "jomiez_site"."enum_leads_preview_kind" DEFAULT 'built-in';
  ALTER TABLE "jomiez_site"."leads" ADD COLUMN "preview_site" jsonb;
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" ADD COLUMN "site_templates_id" integer;
  ALTER TABLE "jomiez_site"."site_templates_texts" ADD CONSTRAINT "site_templates_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "jomiez_site"."site_templates"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "site_templates_project_idx" ON "jomiez_site"."site_templates" USING btree ("project");
  CREATE INDEX "site_templates_updated_at_idx" ON "jomiez_site"."site_templates" USING btree ("updated_at");
  CREATE INDEX "site_templates_created_at_idx" ON "jomiez_site"."site_templates" USING btree ("created_at");
  CREATE INDEX "site_templates_texts_order_parent" ON "jomiez_site"."site_templates_texts" USING btree ("order","parent_id");
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_site_templates_fk" FOREIGN KEY ("site_templates_id") REFERENCES "jomiez_site"."site_templates"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_site_templates_id_idx" ON "jomiez_site"."payload_locked_documents_rels" USING btree ("site_templates_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "jomiez_site"."site_templates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "jomiez_site"."site_templates_texts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "jomiez_site"."site_templates" CASCADE;
  DROP TABLE "jomiez_site"."site_templates_texts" CASCADE;
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_site_templates_fk";
  
  ALTER TABLE "jomiez_site"."access_keys_scopes" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "jomiez_site"."enum_access_keys_scopes";
  CREATE TYPE "jomiez_site"."enum_access_keys_scopes" AS ENUM('read', 'chat', 'approve', 'control');
  ALTER TABLE "jomiez_site"."access_keys_scopes" ALTER COLUMN "value" SET DATA TYPE "jomiez_site"."enum_access_keys_scopes" USING "value"::"jomiez_site"."enum_access_keys_scopes";
  DROP INDEX "jomiez_site"."payload_locked_documents_rels_site_templates_id_idx";
  ALTER TABLE "jomiez_site"."leads" DROP COLUMN "preview_kind";
  ALTER TABLE "jomiez_site"."leads" DROP COLUMN "preview_site";
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" DROP COLUMN "site_templates_id";
  DROP TYPE "jomiez_site"."enum_leads_preview_kind";
  DROP TYPE "jomiez_site"."enum_site_templates_source";
  DROP TYPE "jomiez_site"."enum_site_templates_platform";`)
}
