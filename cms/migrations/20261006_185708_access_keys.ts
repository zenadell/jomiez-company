import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`access_keys_scopes\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`access_keys\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`access_keys_scopes_order_idx\` ON \`access_keys_scopes\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`access_keys_scopes_parent_idx\` ON \`access_keys_scopes\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`access_keys\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`expires_at\` text,
  	\`revoked\` integer DEFAULT false,
  	\`allowed_ips\` text,
  	\`prefix\` text,
  	\`owner_id\` integer,
  	\`last_used_at\` text,
  	\`last_used_ip\` text,
  	\`hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`owner_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`access_keys_owner_idx\` ON \`access_keys\` (\`owner_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`access_keys_hash_idx\` ON \`access_keys\` (\`hash\`);`)
  await db.run(sql`CREATE INDEX \`access_keys_updated_at_idx\` ON \`access_keys\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`access_keys_created_at_idx\` ON \`access_keys\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`access_keys_id\` integer REFERENCES access_keys(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_access_keys_id_idx\` ON \`payload_locked_documents_rels\` (\`access_keys_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`access_keys_scopes\`;`)
  await db.run(sql`DROP TABLE \`access_keys\`;`)
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
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`projects_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`articles_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`redirects_id\`) REFERENCES \`redirects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "inquiries_id", "leads_id", "agent_threads_id", "agent_routines_id", "agent_memory_id", "pages_id", "projects_id", "articles_id", "media_id", "users_id", "redirects_id") SELECT "id", "order", "parent_id", "path", "inquiries_id", "leads_id", "agent_threads_id", "agent_routines_id", "agent_memory_id", "pages_id", "projects_id", "articles_id", "media_id", "users_id", "redirects_id" FROM \`payload_locked_documents_rels\`;`)
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
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_projects_id_idx\` ON \`payload_locked_documents_rels\` (\`projects_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_articles_id_idx\` ON \`payload_locked_documents_rels\` (\`articles_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_redirects_id_idx\` ON \`payload_locked_documents_rels\` (\`redirects_id\`);`)
}
