import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`agent_providers\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`provider\` text NOT NULL,
  	\`fast_model\` text,
  	\`api_key\` text,
  	\`api_key_hint\` text,
  	\`base_u_r_l\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`agent\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`agent_providers_order_idx\` ON \`agent_providers\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`agent_providers_parent_id_idx\` ON \`agent_providers\` (\`_parent_id\`);`)
  await db.run(sql`ALTER TABLE \`agent_threads\` ADD \`provider\` text;`)
  // The key saved before Your providers existed becomes the list's first entry, for the provider it was used with.
  await db.run(sql`INSERT INTO \`agent_providers\` (\`_order\`, \`_parent_id\`, \`id\`, \`provider\`, \`fast_model\`, \`api_key\`, \`api_key_hint\`, \`base_u_r_l\`)
    SELECT 1, \`id\`, lower(hex(randomblob(12))), \`provider\`,
      CASE WHEN (\`provider\` = 'anthropic') = (\`fast_model\` LIKE 'claude-%') THEN \`fast_model\` ELSE NULL END,
      \`api_key\`, \`api_key_hint\`, \`base_u_r_l\`
    FROM \`agent\` WHERE \`api_key\` IS NOT NULL AND \`api_key\` <> '' AND \`provider\` IS NOT NULL;`)
  await db.run(sql`UPDATE \`agent\` SET \`api_key\` = NULL, \`api_key_hint\` = NULL WHERE \`api_key\` IS NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`agent_providers\`;`)
  await db.run(sql`ALTER TABLE \`agent_threads\` DROP COLUMN \`provider\`;`)
}
