import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` ADD \`frame_fit\` text DEFAULT 'cover';`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`frame_zoom\` numeric DEFAULT 100;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`frame_x\` numeric DEFAULT 50;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`frame_y\` numeric DEFAULT 50;`)
  await db.run(sql`ALTER TABLE \`agent\` ADD \`instructions\` text;`)
  await db.run(sql`ALTER TABLE \`agent\` ADD \`instructions_base\` text;`)
  await db.run(sql`ALTER TABLE \`agent\` ADD \`triage_instructions\` text;`)
  await db.run(sql`ALTER TABLE \`agent\` ADD \`triage_instructions_base\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`frame_fit\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`frame_zoom\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`frame_x\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`frame_y\`;`)
  await db.run(sql`ALTER TABLE \`agent\` DROP COLUMN \`instructions\`;`)
  await db.run(sql`ALTER TABLE \`agent\` DROP COLUMN \`instructions_base\`;`)
  await db.run(sql`ALTER TABLE \`agent\` DROP COLUMN \`triage_instructions\`;`)
  await db.run(sql`ALTER TABLE \`agent\` DROP COLUMN \`triage_instructions_base\`;`)
}
