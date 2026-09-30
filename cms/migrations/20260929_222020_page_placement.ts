import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages\` ADD \`placement_menu\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`pages\` ADD \`placement_footer\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`pages\` ADD \`placement_column\` text;`)
  await db.run(sql`ALTER TABLE \`pages\` ADD \`placement_label\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v\` ADD \`version_placement_menu\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_pages_v\` ADD \`version_placement_footer\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_pages_v\` ADD \`version_placement_column\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v\` ADD \`version_placement_label\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`placement_menu\`;`)
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`placement_footer\`;`)
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`placement_column\`;`)
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`placement_label\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v\` DROP COLUMN \`version_placement_menu\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v\` DROP COLUMN \`version_placement_footer\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v\` DROP COLUMN \`version_placement_column\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v\` DROP COLUMN \`version_placement_label\`;`)
}
