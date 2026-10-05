import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`agent\` ADD \`vision_model\` text;`)
  await db.run(sql`ALTER TABLE \`agent\` ADD \`image_model\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`agent\` DROP COLUMN \`vision_model\`;`)
  await db.run(sql`ALTER TABLE \`agent\` DROP COLUMN \`image_model\`;`)
}
