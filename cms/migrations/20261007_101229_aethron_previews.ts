import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`site_templates\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`url\` text NOT NULL,
  	\`source\` text DEFAULT 'free',
  	\`platform\` text DEFAULT 'framer',
  	\`enabled\` integer DEFAULT true,
  	\`style\` text,
  	\`page\` text,
  	\`licence\` text,
  	\`licence_url\` text,
  	\`project\` text,
  	\`prepared\` integer DEFAULT false,
  	\`pages\` text,
  	\`uses\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`site_templates_project_idx\` ON \`site_templates\` (\`project\`);`)
  await db.run(sql`CREATE INDEX \`site_templates_updated_at_idx\` ON \`site_templates\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`site_templates_created_at_idx\` ON \`site_templates\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`site_templates_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`site_templates\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`site_templates_texts_order_parent\` ON \`site_templates_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`ALTER TABLE \`leads\` ADD \`preview_kind\` text DEFAULT 'built-in';`)
  await db.run(sql`ALTER TABLE \`leads\` ADD \`preview_site\` text;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`site_templates_id\` integer REFERENCES site_templates(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_site_templates_id_idx\` ON \`payload_locked_documents_rels\` (\`site_templates_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`site_templates\`;`)
  await db.run(sql`DROP TABLE \`site_templates_texts\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`inquiries_id\` integer,
  	\`leads_id\` integer,
  	\`agent_threads_id\` integer,
  	\`agent_routines_id\` integer,
  	\`agent_memory_id\` integer,
  	\`access_keys_id\` integer,
  	\`pages_id\` integer,
  	\`projects_id\` integer,
  	\`articles_id\` integer,
  	\`media_id\` integer,
  	\`users_id\` integer,
  	\`redirects_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`inquiries_id\`) REFERENCES \`inquiries\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`leads_id\`) REFERENCES \`leads\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`agent_threads_id\`) REFERENCES \`agent_threads\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`agent_routines_id\`) REFERENCES \`agent_routines\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`agent_memory_id\`) REFERENCES \`agent_memory\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`access_keys_id\`) REFERENCES \`access_keys\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`projects_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`articles_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`redirects_id\`) REFERENCES \`redirects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "inquiries_id", "leads_id", "agent_threads_id", "agent_routines_id", "agent_memory_id", "access_keys_id", "pages_id", "projects_id", "articles_id", "media_id", "users_id", "redirects_id") SELECT "id", "order", "parent_id", "path", "inquiries_id", "leads_id", "agent_threads_id", "agent_routines_id", "agent_memory_id", "access_keys_id", "pages_id", "projects_id", "articles_id", "media_id", "users_id", "redirects_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_inquiries_id_idx\` ON \`payload_locked_documents_rels\` (\`inquiries_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_leads_id_idx\` ON \`payload_locked_documents_rels\` (\`leads_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_agent_threads_id_idx\` ON \`payload_locked_documents_rels\` (\`agent_threads_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_agent_routines_id_idx\` ON \`payload_locked_documents_rels\` (\`agent_routines_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_agent_memory_id_idx\` ON \`payload_locked_documents_rels\` (\`agent_memory_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_access_keys_id_idx\` ON \`payload_locked_documents_rels\` (\`access_keys_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_projects_id_idx\` ON \`payload_locked_documents_rels\` (\`projects_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_articles_id_idx\` ON \`payload_locked_documents_rels\` (\`articles_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_redirects_id_idx\` ON \`payload_locked_documents_rels\` (\`redirects_id\`);`)
  await db.run(sql`ALTER TABLE \`leads\` DROP COLUMN \`preview_kind\`;`)
  await db.run(sql`ALTER TABLE \`leads\` DROP COLUMN \`preview_site\`;`)
}
