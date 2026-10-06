import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`leads_log\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`at\` text,
  	\`what\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`leads\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`leads_log_order_idx\` ON \`leads_log\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`leads_log_parent_id_idx\` ON \`leads_log\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`leads\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`kind\` text,
  	\`area\` text,
  	\`country\` text DEFAULT 'NG',
  	\`phone\` text,
  	\`email\` text,
  	\`website\` text,
  	\`address\` text,
  	\`socials\` text,
  	\`status\` text DEFAULT 'new' NOT NULL,
  	\`score\` numeric,
  	\`summary\` text,
  	\`review\` text,
  	\`messages_whatsapp\` text,
  	\`messages_sms\` text,
  	\`messages_email_subject\` text,
  	\`messages_email_body\` text,
  	\`messages_follow_up\` integer,
  	\`messages_written_at\` text,
  	\`preview_slug\` text,
  	\`preview_content\` text,
  	\`preview_made_at\` text,
  	\`preview_views\` numeric DEFAULT 0,
  	\`preview_last_viewed_at\` text,
  	\`contacted_at\` text,
  	\`follow_ups\` numeric DEFAULT 0,
  	\`notes\` text,
  	\`source\` text DEFAULT 'manual',
  	\`source_id\` text,
  	\`domain\` text,
  	\`check\` text,
  	\`shot\` text,
  	\`stop_token\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`leads_status_idx\` ON \`leads\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`leads_score_idx\` ON \`leads\` (\`score\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`leads_preview_preview_slug_idx\` ON \`leads\` (\`preview_slug\`);`)
  await db.run(sql`CREATE INDEX \`leads_source_id_idx\` ON \`leads\` (\`source_id\`);`)
  await db.run(sql`CREATE INDEX \`leads_domain_idx\` ON \`leads\` (\`domain\`);`)
  await db.run(sql`CREATE INDEX \`leads_stop_token_idx\` ON \`leads\` (\`stop_token\`);`)
  await db.run(sql`CREATE INDEX \`leads_updated_at_idx\` ON \`leads\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`leads_created_at_idx\` ON \`leads\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`outreach_searches_kinds\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` text NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`outreach_searches\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`outreach_searches_kinds_order_idx\` ON \`outreach_searches_kinds\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`outreach_searches_kinds_parent_idx\` ON \`outreach_searches_kinds\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`outreach_searches\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`area\` text NOT NULL,
  	\`country\` text DEFAULT 'NG' NOT NULL,
  	\`on\` integer DEFAULT true,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`outreach\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`outreach_searches_order_idx\` ON \`outreach_searches\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`outreach_searches_parent_id_idx\` ON \`outreach_searches\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`outreach\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`enabled\` integer DEFAULT false,
  	\`daily_new\` numeric DEFAULT 15,
  	\`daily_ready\` numeric DEFAULT 10,
  	\`offer\` text DEFAULT 'A fast, modern website that looks great on phones, shows up on Google and turns visitors into calls and WhatsApp messages. Designed and built by Jomiez, usually ready in about a week.',
  	\`sender_name\` text,
  	\`sender_phone\` text,
  	\`address\` text,
  	\`previews\` integer DEFAULT true,
  	\`preview_score\` numeric DEFAULT 55,
  	\`follow_up\` integer DEFAULT true,
  	\`follow_up_days\` numeric DEFAULT 4,
  	\`gmail\` text,
  	\`daily_emails\` numeric DEFAULT 20,
  	\`gmail_password\` text,
  	\`gmail_password_hint\` text,
  	\`pagespeed_key\` text,
  	\`pagespeed_key_hint\` text,
  	\`weekly_post\` integer DEFAULT false,
  	\`find_routine_id\` integer,
  	\`post_routine_id\` integer,
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`find_routine_id\`) REFERENCES \`agent_routines\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`post_routine_id\`) REFERENCES \`agent_routines\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`outreach_find_routine_idx\` ON \`outreach\` (\`find_routine_id\`);`)
  await db.run(sql`CREATE INDEX \`outreach_post_routine_idx\` ON \`outreach\` (\`post_routine_id\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`leads_id\` integer REFERENCES leads(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_leads_id_idx\` ON \`payload_locked_documents_rels\` (\`leads_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`leads_log\`;`)
  await db.run(sql`DROP TABLE \`leads\`;`)
  await db.run(sql`DROP TABLE \`outreach_searches_kinds\`;`)
  await db.run(sql`DROP TABLE \`outreach_searches\`;`)
  await db.run(sql`DROP TABLE \`outreach\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`inquiries_id\` integer,
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
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "inquiries_id", "agent_threads_id", "agent_routines_id", "agent_memory_id", "pages_id", "projects_id", "articles_id", "media_id", "users_id", "redirects_id") SELECT "id", "order", "parent_id", "path", "inquiries_id", "agent_threads_id", "agent_routines_id", "agent_memory_id", "pages_id", "projects_id", "articles_id", "media_id", "users_id", "redirects_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_inquiries_id_idx\` ON \`payload_locked_documents_rels\` (\`inquiries_id\`);`)
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
