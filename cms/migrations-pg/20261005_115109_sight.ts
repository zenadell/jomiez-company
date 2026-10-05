import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "jomiez_site"."agent" ADD COLUMN "vision_model" varchar;
  ALTER TABLE "jomiez_site"."agent" ADD COLUMN "image_model" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "jomiez_site"."agent" DROP COLUMN "vision_model";
  ALTER TABLE "jomiez_site"."agent" DROP COLUMN "image_model";`)
}
