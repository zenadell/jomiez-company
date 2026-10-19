import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`outreach\` ADD \`gmail_script_url\` text;`)
  await db.run(sql`ALTER TABLE \`outreach\` ADD \`gmail_script_secret\` text;`)
  await db.run(sql`ALTER TABLE \`outreach\` ADD \`gmail_script_secret_hint\` text;`)
  // Leads wrongly told their site was broken get checked again (see cms/outreach/fixups.ts).
  // A new database has none, and reading leads through today's schema (with columns later
  // migrations add) would fail there, so the repair only runs where there are leads to repair.
  const row = await db.get<{ n: number }>(sql`SELECT count(*) AS n FROM \`leads\`;`)
  if (!Number(row?.n)) return
  const { recheckTurnedAway } = await import("../outreach/fixups");
  await recheckTurnedAway(payload, req);
}


export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`outreach\` DROP COLUMN \`gmail_script_url\`;`)
  await db.run(sql`ALTER TABLE \`outreach\` DROP COLUMN \`gmail_script_secret\`;`)
  await db.run(sql`ALTER TABLE \`outreach\` DROP COLUMN \`gmail_script_secret_hint\`;`)
}
