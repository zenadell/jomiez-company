import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`outreach\` ADD \`gmail_script_url\` text;`)
  await db.run(sql`ALTER TABLE \`outreach\` ADD \`gmail_script_secret\` text;`)
  await db.run(sql`ALTER TABLE \`outreach\` ADD \`gmail_script_secret_hint\` text;`)
  // Leads wrongly told their site was broken get checked again (see cms/outreach/fixups.ts).
  const { recheckTurnedAway } = await import("../outreach/fixups");
  await recheckTurnedAway(payload, req);
}


export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`outreach\` DROP COLUMN \`gmail_script_url\`;`)
  await db.run(sql`ALTER TABLE \`outreach\` DROP COLUMN \`gmail_script_secret\`;`)
  await db.run(sql`ALTER TABLE \`outreach\` DROP COLUMN \`gmail_script_secret_hint\`;`)
}
