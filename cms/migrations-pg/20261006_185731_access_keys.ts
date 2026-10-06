import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "jomiez_site"."enum_access_keys_scopes" AS ENUM('read', 'chat', 'approve', 'control');
  ALTER TYPE "jomiez_site"."enum_agent_threads_source" ADD VALUE 'api';
  CREATE TABLE "jomiez_site"."access_keys_scopes" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "jomiez_site"."enum_access_keys_scopes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "jomiez_site"."access_keys" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone,
  	"revoked" boolean DEFAULT false,
  	"allowed_ips" varchar,
  	"prefix" varchar,
  	"owner_id" integer,
  	"last_used_at" timestamp(3) with time zone,
  	"last_used_ip" varchar,
  	"hash" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" ADD COLUMN "access_keys_id" integer;
  ALTER TABLE "jomiez_site"."access_keys_scopes" ADD CONSTRAINT "access_keys_scopes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "jomiez_site"."access_keys"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."access_keys" ADD CONSTRAINT "access_keys_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "jomiez_site"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "access_keys_scopes_order_idx" ON "jomiez_site"."access_keys_scopes" USING btree ("order");
  CREATE INDEX "access_keys_scopes_parent_idx" ON "jomiez_site"."access_keys_scopes" USING btree ("parent_id");
  CREATE INDEX "access_keys_owner_idx" ON "jomiez_site"."access_keys" USING btree ("owner_id");
  CREATE UNIQUE INDEX "access_keys_hash_idx" ON "jomiez_site"."access_keys" USING btree ("hash");
  CREATE INDEX "access_keys_updated_at_idx" ON "jomiez_site"."access_keys" USING btree ("updated_at");
  CREATE INDEX "access_keys_created_at_idx" ON "jomiez_site"."access_keys" USING btree ("created_at");
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_access_keys_fk" FOREIGN KEY ("access_keys_id") REFERENCES "jomiez_site"."access_keys"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_access_keys_id_idx" ON "jomiez_site"."payload_locked_documents_rels" USING btree ("access_keys_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "jomiez_site"."access_keys_scopes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "jomiez_site"."access_keys" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "jomiez_site"."access_keys_scopes" CASCADE;
  DROP TABLE "jomiez_site"."access_keys" CASCADE;
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_access_keys_fk";
  
  ALTER TABLE "jomiez_site"."agent_threads" ALTER COLUMN "source" SET DATA TYPE text;
  ALTER TABLE "jomiez_site"."agent_threads" ALTER COLUMN "source" SET DEFAULT 'console'::text;
  DROP TYPE "jomiez_site"."enum_agent_threads_source";
  CREATE TYPE "jomiez_site"."enum_agent_threads_source" AS ENUM('console', 'page', 'voice', 'routine', 'inbox');
  ALTER TABLE "jomiez_site"."agent_threads" ALTER COLUMN "source" SET DEFAULT 'console'::"jomiez_site"."enum_agent_threads_source";
  ALTER TABLE "jomiez_site"."agent_threads" ALTER COLUMN "source" SET DATA TYPE "jomiez_site"."enum_agent_threads_source" USING "source"::"jomiez_site"."enum_agent_threads_source";
  DROP INDEX "jomiez_site"."payload_locked_documents_rels_access_keys_id_idx";
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" DROP COLUMN "access_keys_id";
  DROP TYPE "jomiez_site"."enum_access_keys_scopes";`)
}
