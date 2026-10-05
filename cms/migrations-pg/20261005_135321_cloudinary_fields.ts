import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "jomiez_site"."media" ADD COLUMN "prefix" varchar DEFAULT '';
  ALTER TABLE "jomiez_site"."media" ADD COLUMN "_objectkey" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "jomiez_site"."media" DROP COLUMN "prefix";
  ALTER TABLE "jomiez_site"."media" DROP COLUMN "_objectkey";`)
}
