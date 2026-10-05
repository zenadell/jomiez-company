import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "jomiez_site"."enum_agent_providers_provider" AS ENUM('anthropic', 'openai', 'google', 'openrouter', 'groq', 'deepseek', 'xai', 'mistral', 'together', 'ollama', 'custom');
  CREATE TABLE "jomiez_site"."agent_providers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"provider" "jomiez_site"."enum_agent_providers_provider" NOT NULL,
  	"fast_model" varchar,
  	"api_key" varchar,
  	"api_key_hint" varchar,
  	"base_u_r_l" varchar
  );
  
  ALTER TABLE "jomiez_site"."agent_threads" ADD COLUMN "provider" varchar;
  ALTER TABLE "jomiez_site"."agent_providers" ADD CONSTRAINT "agent_providers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."agent"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "agent_providers_order_idx" ON "jomiez_site"."agent_providers" USING btree ("_order");
  CREATE INDEX "agent_providers_parent_id_idx" ON "jomiez_site"."agent_providers" USING btree ("_parent_id");`)
  // The key saved before Your providers existed becomes the list's first entry, for the provider it was used with.
  await db.execute(sql`
   INSERT INTO "jomiez_site"."agent_providers" ("_order", "_parent_id", "id", "provider", "fast_model", "api_key", "api_key_hint", "base_u_r_l")
   SELECT 1, a."id", substr(md5(random()::text || a."id"::text), 1, 24), a."provider"::text::"jomiez_site"."enum_agent_providers_provider",
     CASE WHEN (a."provider"::text = 'anthropic') = (a."fast_model" ILIKE 'claude-%') THEN a."fast_model" ELSE NULL END,
     a."api_key", a."api_key_hint", a."base_u_r_l"
   FROM "jomiez_site"."agent" a
   WHERE a."api_key" IS NOT NULL AND a."api_key" <> '' AND a."provider" IS NOT NULL;
  UPDATE "jomiez_site"."agent" SET "api_key" = NULL, "api_key_hint" = NULL WHERE "api_key" IS NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "jomiez_site"."agent_providers" CASCADE;
  ALTER TABLE "jomiez_site"."agent_threads" DROP COLUMN "provider";
  DROP TYPE "jomiez_site"."enum_agent_providers_provider";`)
}
