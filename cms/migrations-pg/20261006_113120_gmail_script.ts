import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "jomiez_site"."outreach" ADD COLUMN "gmail_script_url" varchar;
  ALTER TABLE "jomiez_site"."outreach" ADD COLUMN "gmail_script_secret" varchar;
  ALTER TABLE "jomiez_site"."outreach" ADD COLUMN "gmail_script_secret_hint" varchar;`)
  // Leads wrongly told their site was broken get checked again (see cms/outreach/fixups.ts).
  const { recheckTurnedAway } = await import("../outreach/fixups");
  await recheckTurnedAway(payload, req);
}


export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "jomiez_site"."outreach" DROP COLUMN "gmail_script_url";
  ALTER TABLE "jomiez_site"."outreach" DROP COLUMN "gmail_script_secret";
  ALTER TABLE "jomiez_site"."outreach" DROP COLUMN "gmail_script_secret_hint";`)
}
