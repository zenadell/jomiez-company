import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "jomiez_site"."enum_agent_threads_source" ADD VALUE 'voice' BEFORE 'routine';
  ALTER TABLE "jomiez_site"."agent" ADD COLUMN "voice_enabled" boolean DEFAULT true;
  ALTER TABLE "jomiez_site"."agent" ADD COLUMN "voice_model" varchar DEFAULT 'gemini-3.1-flash-live-preview';
  ALTER TABLE "jomiez_site"."agent" ADD COLUMN "voice_name" varchar DEFAULT 'Kore';
  ALTER TABLE "jomiez_site"."agent" ADD COLUMN "voice_language" varchar;
  ALTER TABLE "jomiez_site"."agent" ADD COLUMN "voice_api_key" varchar;
  ALTER TABLE "jomiez_site"."agent" ADD COLUMN "voice_api_key_hint" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "jomiez_site"."agent_threads" ALTER COLUMN "source" SET DATA TYPE text;
  ALTER TABLE "jomiez_site"."agent_threads" ALTER COLUMN "source" SET DEFAULT 'console'::text;
  DROP TYPE "jomiez_site"."enum_agent_threads_source";
  CREATE TYPE "jomiez_site"."enum_agent_threads_source" AS ENUM('console', 'page', 'routine', 'inbox');
  ALTER TABLE "jomiez_site"."agent_threads" ALTER COLUMN "source" SET DEFAULT 'console'::"jomiez_site"."enum_agent_threads_source";
  ALTER TABLE "jomiez_site"."agent_threads" ALTER COLUMN "source" SET DATA TYPE "jomiez_site"."enum_agent_threads_source" USING "source"::"jomiez_site"."enum_agent_threads_source";
  ALTER TABLE "jomiez_site"."agent" DROP COLUMN "voice_enabled";
  ALTER TABLE "jomiez_site"."agent" DROP COLUMN "voice_model";
  ALTER TABLE "jomiez_site"."agent" DROP COLUMN "voice_name";
  ALTER TABLE "jomiez_site"."agent" DROP COLUMN "voice_language";
  ALTER TABLE "jomiez_site"."agent" DROP COLUMN "voice_api_key";
  ALTER TABLE "jomiez_site"."agent" DROP COLUMN "voice_api_key_hint";`)
}
