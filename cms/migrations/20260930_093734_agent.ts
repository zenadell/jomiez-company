import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`agent_threads\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`owner_id\` integer,
  	\`source\` text DEFAULT 'console',
  	\`status\` text DEFAULT 'idle',
  	\`context\` text,
  	\`messages\` text,
  	\`events\` text,
  	\`plan\` text,
  	\`pending\` text,
  	\`changes\` text,
  	\`model\` text,
  	\`usage_input\` numeric DEFAULT 0,
  	\`usage_output\` numeric DEFAULT 0,
  	\`routine_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`owner_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`routine_id\`) REFERENCES \`agent_routines\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`agent_threads_owner_idx\` ON \`agent_threads\` (\`owner_id\`);`)
  await db.run(sql`CREATE INDEX \`agent_threads_routine_idx\` ON \`agent_threads\` (\`routine_id\`);`)
  await db.run(sql`CREATE INDEX \`agent_threads_updated_at_idx\` ON \`agent_threads\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`agent_threads_created_at_idx\` ON \`agent_threads\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`agent_routines\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`instruction\` text NOT NULL,
  	\`enabled\` integer DEFAULT true,
  	\`schedule\` text DEFAULT 'daily' NOT NULL,
  	\`time\` text DEFAULT '08:00',
  	\`weekday\` text DEFAULT '1',
  	\`timezone\` text DEFAULT 'Africa/Lagos',
  	\`mode\` text DEFAULT 'inherit',
  	\`owner_id\` integer,
  	\`next_run_at\` text,
  	\`last_run_at\` text,
  	\`last_status\` text,
  	\`last_thread_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`owner_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`last_thread_id\`) REFERENCES \`agent_threads\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`agent_routines_owner_idx\` ON \`agent_routines\` (\`owner_id\`);`)
  await db.run(sql`CREATE INDEX \`agent_routines_last_thread_idx\` ON \`agent_routines\` (\`last_thread_id\`);`)
  await db.run(sql`CREATE INDEX \`agent_routines_updated_at_idx\` ON \`agent_routines\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`agent_routines_created_at_idx\` ON \`agent_routines\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`agent_memory\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`content\` text NOT NULL,
  	\`kind\` text DEFAULT 'fact',
  	\`source\` text DEFAULT 'you',
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`agent_memory_updated_at_idx\` ON \`agent_memory\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`agent_memory_created_at_idx\` ON \`agent_memory\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`agent\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`enabled\` integer DEFAULT true,
  	\`name\` text DEFAULT 'Keeper' NOT NULL,
  	\`provider\` text DEFAULT 'anthropic' NOT NULL,
  	\`model\` text DEFAULT 'claude-opus-5-5' NOT NULL,
  	\`api_key\` text,
  	\`api_key_hint\` text,
  	\`base_u_r_l\` text,
  	\`fast_model\` text DEFAULT 'claude-haiku-4-5-20251001',
  	\`thinking\` text DEFAULT 'provider-default',
  	\`mode\` text DEFAULT 'drafts',
  	\`deletes\` text DEFAULT 'ask',
  	\`email\` text DEFAULT 'ask',
  	\`web\` integer DEFAULT true,
  	\`persona\` text DEFAULT 'Write like jomiez.com: an ancient, natural voice (roots, seasons, gardens, craft), calm and certain, never hype. Short sentences. Plain words. No exclamation marks.
  Jomiez Innovation is a software company that grows its own AI products (Chaka AI, Chaka WAP) and builds custom software for businesses.
  Never invent facts, numbers, clients or testimonials. If something isn''t known, ask or leave it out.',
  	\`triage\` integer DEFAULT true,
  	\`triage_draft\` integer DEFAULT true,
  	\`notify_auto\` integer DEFAULT true,
  	\`notify_email\` text,
  	\`max_steps\` numeric DEFAULT 40,
  	\`daily_runs\` numeric DEFAULT 300,
  	\`daily_tokens\` numeric DEFAULT 5000000,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`agent_threads_id\` integer REFERENCES agent_threads(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`agent_routines_id\` integer REFERENCES agent_routines(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`agent_memory_id\` integer REFERENCES agent_memory(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_agent_threads_id_idx\` ON \`payload_locked_documents_rels\` (\`agent_threads_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_agent_routines_id_idx\` ON \`payload_locked_documents_rels\` (\`agent_routines_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_agent_memory_id_idx\` ON \`payload_locked_documents_rels\` (\`agent_memory_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`agent_threads\`;`)
  await db.run(sql`DROP TABLE \`agent_routines\`;`)
  await db.run(sql`DROP TABLE \`agent_memory\`;`)
  await db.run(sql`DROP TABLE \`agent\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`inquiries_id\` integer,
  	\`pages_id\` integer,
  	\`projects_id\` integer,
  	\`articles_id\` integer,
  	\`media_id\` integer,
  	\`users_id\` integer,
  	\`redirects_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`inquiries_id\`) REFERENCES \`inquiries\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`projects_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`articles_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`redirects_id\`) REFERENCES \`redirects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "inquiries_id", "pages_id", "projects_id", "articles_id", "media_id", "users_id", "redirects_id") SELECT "id", "order", "parent_id", "path", "inquiries_id", "pages_id", "projects_id", "articles_id", "media_id", "users_id", "redirects_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_inquiries_id_idx\` ON \`payload_locked_documents_rels\` (\`inquiries_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_projects_id_idx\` ON \`payload_locked_documents_rels\` (\`projects_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_articles_id_idx\` ON \`payload_locked_documents_rels\` (\`articles_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_redirects_id_idx\` ON \`payload_locked_documents_rels\` (\`redirects_id\`);`)
}
