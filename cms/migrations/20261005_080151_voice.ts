import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`agent\` ADD \`voice_enabled\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`agent\` ADD \`voice_model\` text DEFAULT 'gemini-3.1-flash-live-preview';`)
  await db.run(sql`ALTER TABLE \`agent\` ADD \`voice_name\` text DEFAULT 'Kore';`)
  await db.run(sql`ALTER TABLE \`agent\` ADD \`voice_language\` text;`)
  await db.run(sql`ALTER TABLE \`agent\` ADD \`voice_api_key\` text;`)
  await db.run(sql`ALTER TABLE \`agent\` ADD \`voice_api_key_hint\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`agent\` DROP COLUMN \`voice_enabled\`;`)
  await db.run(sql`ALTER TABLE \`agent\` DROP COLUMN \`voice_model\`;`)
  await db.run(sql`ALTER TABLE \`agent\` DROP COLUMN \`voice_name\`;`)
  await db.run(sql`ALTER TABLE \`agent\` DROP COLUMN \`voice_language\`;`)
  await db.run(sql`ALTER TABLE \`agent\` DROP COLUMN \`voice_api_key\`;`)
  await db.run(sql`ALTER TABLE \`agent\` DROP COLUMN \`voice_api_key_hint\`;`)
}
