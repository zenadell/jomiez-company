import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "jomiez_site"."enum_media_frame_fit" AS ENUM('cover', 'contain');
  ALTER TABLE "jomiez_site"."media" ADD COLUMN "frame_fit" "jomiez_site"."enum_media_frame_fit" DEFAULT 'cover';
  ALTER TABLE "jomiez_site"."media" ADD COLUMN "frame_zoom" numeric DEFAULT 100;
  ALTER TABLE "jomiez_site"."media" ADD COLUMN "frame_x" numeric DEFAULT 50;
  ALTER TABLE "jomiez_site"."media" ADD COLUMN "frame_y" numeric DEFAULT 50;
  ALTER TABLE "jomiez_site"."agent" ADD COLUMN "instructions" varchar;
  ALTER TABLE "jomiez_site"."agent" ADD COLUMN "instructions_base" varchar;
  ALTER TABLE "jomiez_site"."agent" ADD COLUMN "triage_instructions" varchar;
  ALTER TABLE "jomiez_site"."agent" ADD COLUMN "triage_instructions_base" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "jomiez_site"."media" DROP COLUMN "frame_fit";
  ALTER TABLE "jomiez_site"."media" DROP COLUMN "frame_zoom";
  ALTER TABLE "jomiez_site"."media" DROP COLUMN "frame_x";
  ALTER TABLE "jomiez_site"."media" DROP COLUMN "frame_y";
  ALTER TABLE "jomiez_site"."agent" DROP COLUMN "instructions";
  ALTER TABLE "jomiez_site"."agent" DROP COLUMN "instructions_base";
  ALTER TABLE "jomiez_site"."agent" DROP COLUMN "triage_instructions";
  ALTER TABLE "jomiez_site"."agent" DROP COLUMN "triage_instructions_base";
  DROP TYPE "jomiez_site"."enum_media_frame_fit";`)
}
