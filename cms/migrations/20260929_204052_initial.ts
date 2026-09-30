import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`projects_services\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`projects_services_order_idx\` ON \`projects_services\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`projects_services_parent_id_idx\` ON \`projects_services\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`projects_stats\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`projects_stats_order_idx\` ON \`projects_stats\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`projects_stats_parent_id_idx\` ON \`projects_stats\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`projects_sections_points\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`projects_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`projects_sections_points_order_idx\` ON \`projects_sections_points\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`projects_sections_points_parent_id_idx\` ON \`projects_sections_points\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`projects_sections\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`projects_sections_order_idx\` ON \`projects_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`projects_sections_parent_id_idx\` ON \`projects_sections\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`projects_product_page_stats\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`projects_product_page_stats_order_idx\` ON \`projects_product_page_stats\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`projects_product_page_stats_parent_id_idx\` ON \`projects_product_page_stats\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`projects_product_page_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`text\` text,
  	\`mock\` text DEFAULT 'research',
  	\`mock_title\` text,
  	\`art_id\` integer,
  	FOREIGN KEY (\`art_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`projects_product_page_cards_order_idx\` ON \`projects_product_page_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`projects_product_page_cards_parent_id_idx\` ON \`projects_product_page_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`projects_product_page_cards_art_idx\` ON \`projects_product_page_cards\` (\`art_id\`);`)
  await db.run(sql`CREATE TABLE \`projects_product_page_system_features\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon\` text DEFAULT 'shieldCheck',
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`projects_product_page_system_features_order_idx\` ON \`projects_product_page_system_features\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`projects_product_page_system_features_parent_id_idx\` ON \`projects_product_page_system_features\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`projects_product_page_faq_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`q\` text,
  	\`a\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`projects_product_page_faq_items_order_idx\` ON \`projects_product_page_faq_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`projects_product_page_faq_items_parent_id_idx\` ON \`projects_product_page_faq_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`projects\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`name\` text,
  	\`category\` text,
  	\`is_product\` integer DEFAULT false,
  	\`summary\` text,
  	\`image_id\` integer,
  	\`client\` text,
  	\`year\` text,
  	\`link_label\` text,
  	\`link_href\` text,
  	\`product_page_hero_title\` text,
  	\`product_page_hero_lead\` text,
  	\`product_page_hero_cta_label\` text,
  	\`product_page_hero_cta_href\` text,
  	\`product_page_hero_image_id\` integer,
  	\`product_page_hero_proof\` text,
  	\`product_page_showcase_title\` text,
  	\`product_page_showcase_lead\` text,
  	\`product_page_showcase_background_id\` integer,
  	\`product_page_showcase_screen_id\` integer,
  	\`product_page_showcase_address\` text,
  	\`product_page_statement\` text,
  	\`product_page_system_label\` text,
  	\`product_page_system_text\` text,
  	\`product_page_faq_sub\` text,
  	\`product_page_faq_title\` text,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`meta_image_id\` integer,
  	\`slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`product_page_hero_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`product_page_showcase_background_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`product_page_showcase_screen_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`projects__order_idx\` ON \`projects\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`projects_image_idx\` ON \`projects\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`projects_product_page_hero_product_page_hero_image_idx\` ON \`projects\` (\`product_page_hero_image_id\`);`)
  await db.run(sql`CREATE INDEX \`projects_product_page_showcase_product_page_showcase_bac_idx\` ON \`projects\` (\`product_page_showcase_background_id\`);`)
  await db.run(sql`CREATE INDEX \`projects_product_page_showcase_product_page_showcase_scr_idx\` ON \`projects\` (\`product_page_showcase_screen_id\`);`)
  await db.run(sql`CREATE INDEX \`projects_meta_meta_image_idx\` ON \`projects\` (\`meta_image_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`projects_slug_idx\` ON \`projects\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`projects_updated_at_idx\` ON \`projects\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`projects_created_at_idx\` ON \`projects\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`projects__status_idx\` ON \`projects\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_projects_v_version_services\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_projects_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_projects_v_version_services_order_idx\` ON \`_projects_v_version_services\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_services_parent_id_idx\` ON \`_projects_v_version_services\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_projects_v_version_stats\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`label\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_projects_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_projects_v_version_stats_order_idx\` ON \`_projects_v_version_stats\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_stats_parent_id_idx\` ON \`_projects_v_version_stats\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_projects_v_version_sections_points\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_projects_v_version_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_projects_v_version_sections_points_order_idx\` ON \`_projects_v_version_sections_points\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_sections_points_parent_id_idx\` ON \`_projects_v_version_sections_points\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_projects_v_version_sections\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_projects_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_projects_v_version_sections_order_idx\` ON \`_projects_v_version_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_sections_parent_id_idx\` ON \`_projects_v_version_sections\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_projects_v_version_product_page_stats\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_projects_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_projects_v_version_product_page_stats_order_idx\` ON \`_projects_v_version_product_page_stats\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_product_page_stats_parent_id_idx\` ON \`_projects_v_version_product_page_stats\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_projects_v_version_product_page_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`text\` text,
  	\`mock\` text DEFAULT 'research',
  	\`mock_title\` text,
  	\`art_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`art_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_projects_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_projects_v_version_product_page_cards_order_idx\` ON \`_projects_v_version_product_page_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_product_page_cards_parent_id_idx\` ON \`_projects_v_version_product_page_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_product_page_cards_art_idx\` ON \`_projects_v_version_product_page_cards\` (\`art_id\`);`)
  await db.run(sql`CREATE TABLE \`_projects_v_version_product_page_system_features\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`icon\` text DEFAULT 'shieldCheck',
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_projects_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_projects_v_version_product_page_system_features_order_idx\` ON \`_projects_v_version_product_page_system_features\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_product_page_system_features_parent_id_idx\` ON \`_projects_v_version_product_page_system_features\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_projects_v_version_product_page_faq_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`q\` text,
  	\`a\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_projects_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_projects_v_version_product_page_faq_items_order_idx\` ON \`_projects_v_version_product_page_faq_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_product_page_faq_items_parent_id_idx\` ON \`_projects_v_version_product_page_faq_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_projects_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version__order\` text,
  	\`version_name\` text,
  	\`version_category\` text,
  	\`version_is_product\` integer DEFAULT false,
  	\`version_summary\` text,
  	\`version_image_id\` integer,
  	\`version_client\` text,
  	\`version_year\` text,
  	\`version_link_label\` text,
  	\`version_link_href\` text,
  	\`version_product_page_hero_title\` text,
  	\`version_product_page_hero_lead\` text,
  	\`version_product_page_hero_cta_label\` text,
  	\`version_product_page_hero_cta_href\` text,
  	\`version_product_page_hero_image_id\` integer,
  	\`version_product_page_hero_proof\` text,
  	\`version_product_page_showcase_title\` text,
  	\`version_product_page_showcase_lead\` text,
  	\`version_product_page_showcase_background_id\` integer,
  	\`version_product_page_showcase_screen_id\` integer,
  	\`version_product_page_showcase_address\` text,
  	\`version_product_page_statement\` text,
  	\`version_product_page_system_label\` text,
  	\`version_product_page_system_text\` text,
  	\`version_product_page_faq_sub\` text,
  	\`version_product_page_faq_title\` text,
  	\`version_meta_title\` text,
  	\`version_meta_description\` text,
  	\`version_meta_image_id\` integer,
  	\`version_slug\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_product_page_hero_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_product_page_showcase_background_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_product_page_showcase_screen_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_projects_v_parent_idx\` ON \`_projects_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_version__order_idx\` ON \`_projects_v\` (\`version__order\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_version_image_idx\` ON \`_projects_v\` (\`version_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_product_page_hero_version_product_pa_idx\` ON \`_projects_v\` (\`version_product_page_hero_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_product_page_showcase_version_produc_idx\` ON \`_projects_v\` (\`version_product_page_showcase_background_id\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_product_page_showcase_version_prod_1_idx\` ON \`_projects_v\` (\`version_product_page_showcase_screen_id\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_meta_version_meta_image_idx\` ON \`_projects_v\` (\`version_meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_version_slug_idx\` ON \`_projects_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_version_updated_at_idx\` ON \`_projects_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_version_created_at_idx\` ON \`_projects_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_version_version__status_idx\` ON \`_projects_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_created_at_idx\` ON \`_projects_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_updated_at_idx\` ON \`_projects_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_latest_idx\` ON \`_projects_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_projects_v_autosave_idx\` ON \`_projects_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`articles\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`excerpt\` text,
  	\`image_id\` integer,
  	\`body\` text,
  	\`slug\` text,
  	\`category\` text,
  	\`author\` text DEFAULT 'Jomiez Team',
  	\`date\` text,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`meta_image_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`articles_image_idx\` ON \`articles\` (\`image_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`articles_slug_idx\` ON \`articles\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`articles_meta_meta_image_idx\` ON \`articles\` (\`meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`articles_updated_at_idx\` ON \`articles\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`articles_created_at_idx\` ON \`articles\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`articles__status_idx\` ON \`articles\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_articles_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_excerpt\` text,
  	\`version_image_id\` integer,
  	\`version_body\` text,
  	\`version_slug\` text,
  	\`version_category\` text,
  	\`version_author\` text DEFAULT 'Jomiez Team',
  	\`version_date\` text,
  	\`version_meta_title\` text,
  	\`version_meta_description\` text,
  	\`version_meta_image_id\` integer,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_articles_v_parent_idx\` ON \`_articles_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_version_image_idx\` ON \`_articles_v\` (\`version_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_version_slug_idx\` ON \`_articles_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_meta_version_meta_image_idx\` ON \`_articles_v\` (\`version_meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_version_updated_at_idx\` ON \`_articles_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_version_created_at_idx\` ON \`_articles_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_version_version__status_idx\` ON \`_articles_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_created_at_idx\` ON \`_articles_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_updated_at_idx\` ON \`_articles_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_latest_idx\` ON \`_articles_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_articles_v_autosave_idx\` ON \`_articles_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_page_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`title\` text,
  	\`lead\` text,
  	\`show_cta\` integer DEFAULT true,
  	\`cta_label\` text,
  	\`cta_href\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_page_hero_order_idx\` ON \`pages_blocks_page_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_page_hero_parent_id_idx\` ON \`pages_blocks_page_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_page_hero_path_idx\` ON \`pages_blocks_page_hero\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_content_order_idx\` ON \`pages_blocks_content\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_content_parent_id_idx\` ON \`pages_blocks_content\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_content_path_idx\` ON \`pages_blocks_content\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_image_band\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`lead\` text,
  	\`pill\` text,
  	\`title\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_image_band_order_idx\` ON \`pages_blocks_image_band\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_image_band_parent_id_idx\` ON \`pages_blocks_image_band\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_image_band_path_idx\` ON \`pages_blocks_image_band\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_image_band_image_idx\` ON \`pages_blocks_image_band\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_list_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_list\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_list_items_order_idx\` ON \`pages_blocks_list_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_list_items_parent_id_idx\` ON \`pages_blocks_list_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_list_order_idx\` ON \`pages_blocks_list\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_list_parent_id_idx\` ON \`pages_blocks_list\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_list_path_idx\` ON \`pages_blocks_list\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_projects\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_projects_order_idx\` ON \`pages_blocks_projects\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_projects_parent_id_idx\` ON \`pages_blocks_projects\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_projects_path_idx\` ON \`pages_blocks_projects\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_journal\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text DEFAULT 'Journal',
  	\`count\` numeric DEFAULT 3,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_journal_order_idx\` ON \`pages_blocks_journal\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_journal_parent_id_idx\` ON \`pages_blocks_journal\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_journal_path_idx\` ON \`pages_blocks_journal\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_faq_custom_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`q\` text,
  	\`a\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_faq\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_custom_items_order_idx\` ON \`pages_blocks_faq_custom_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_custom_items_parent_id_idx\` ON \`pages_blocks_faq_custom_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_faq\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`use_site_faq\` integer DEFAULT true,
  	\`custom_label\` text,
  	\`custom_sub\` text,
  	\`custom_title\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_order_idx\` ON \`pages_blocks_faq\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_parent_id_idx\` ON \`pages_blocks_faq\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_path_idx\` ON \`pages_blocks_faq\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_cta\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`text\` text,
  	\`cta_label\` text,
  	\`cta_href\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_cta_order_idx\` ON \`pages_blocks_cta\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_cta_parent_id_idx\` ON \`pages_blocks_cta\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_cta_path_idx\` ON \`pages_blocks_cta\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_tenets\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_tenets_order_idx\` ON \`pages_blocks_tenets\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_tenets_parent_id_idx\` ON \`pages_blocks_tenets\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_tenets_path_idx\` ON \`pages_blocks_tenets\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_pricing\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_pricing_order_idx\` ON \`pages_blocks_pricing\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_pricing_parent_id_idx\` ON \`pages_blocks_pricing\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_pricing_path_idx\` ON \`pages_blocks_pricing\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`slug\` text,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`meta_image_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_slug_idx\` ON \`pages\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`pages_meta_meta_image_idx\` ON \`pages\` (\`meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_updated_at_idx\` ON \`pages\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`pages_created_at_idx\` ON \`pages\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`pages__status_idx\` ON \`pages\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`pages_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`projects_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`projects_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_rels_order_idx\` ON \`pages_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_parent_idx\` ON \`pages_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_path_idx\` ON \`pages_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_projects_id_idx\` ON \`pages_rels\` (\`projects_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_page_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`title\` text,
  	\`lead\` text,
  	\`show_cta\` integer DEFAULT true,
  	\`cta_label\` text,
  	\`cta_href\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_page_hero_order_idx\` ON \`_pages_v_blocks_page_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_page_hero_parent_id_idx\` ON \`_pages_v_blocks_page_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_page_hero_path_idx\` ON \`_pages_v_blocks_page_hero\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_content\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_content_order_idx\` ON \`_pages_v_blocks_content\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_content_parent_id_idx\` ON \`_pages_v_blocks_content\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_content_path_idx\` ON \`_pages_v_blocks_content\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_image_band\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`lead\` text,
  	\`pill\` text,
  	\`title\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_image_band_order_idx\` ON \`_pages_v_blocks_image_band\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_image_band_parent_id_idx\` ON \`_pages_v_blocks_image_band\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_image_band_path_idx\` ON \`_pages_v_blocks_image_band\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_image_band_image_idx\` ON \`_pages_v_blocks_image_band\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_list_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_list\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_list_items_order_idx\` ON \`_pages_v_blocks_list_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_list_items_parent_id_idx\` ON \`_pages_v_blocks_list_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_list_order_idx\` ON \`_pages_v_blocks_list\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_list_parent_id_idx\` ON \`_pages_v_blocks_list\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_list_path_idx\` ON \`_pages_v_blocks_list\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_projects\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_projects_order_idx\` ON \`_pages_v_blocks_projects\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_projects_parent_id_idx\` ON \`_pages_v_blocks_projects\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_projects_path_idx\` ON \`_pages_v_blocks_projects\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_journal\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text DEFAULT 'Journal',
  	\`count\` numeric DEFAULT 3,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_journal_order_idx\` ON \`_pages_v_blocks_journal\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_journal_parent_id_idx\` ON \`_pages_v_blocks_journal\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_journal_path_idx\` ON \`_pages_v_blocks_journal\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_faq_custom_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`q\` text,
  	\`a\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_faq\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_custom_items_order_idx\` ON \`_pages_v_blocks_faq_custom_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_custom_items_parent_id_idx\` ON \`_pages_v_blocks_faq_custom_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_faq\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`use_site_faq\` integer DEFAULT true,
  	\`custom_label\` text,
  	\`custom_sub\` text,
  	\`custom_title\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_order_idx\` ON \`_pages_v_blocks_faq\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_parent_id_idx\` ON \`_pages_v_blocks_faq\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_path_idx\` ON \`_pages_v_blocks_faq\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_cta\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`text\` text,
  	\`cta_label\` text,
  	\`cta_href\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_cta_order_idx\` ON \`_pages_v_blocks_cta\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_cta_parent_id_idx\` ON \`_pages_v_blocks_cta\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_cta_path_idx\` ON \`_pages_v_blocks_cta\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_tenets\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_tenets_order_idx\` ON \`_pages_v_blocks_tenets\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_tenets_parent_id_idx\` ON \`_pages_v_blocks_tenets\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_tenets_path_idx\` ON \`_pages_v_blocks_tenets\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_pricing\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_pricing_order_idx\` ON \`_pages_v_blocks_pricing\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_pricing_parent_id_idx\` ON \`_pages_v_blocks_pricing\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_pricing_path_idx\` ON \`_pages_v_blocks_pricing\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_slug\` text,
  	\`version_meta_title\` text,
  	\`version_meta_description\` text,
  	\`version_meta_image_id\` integer,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_parent_idx\` ON \`_pages_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_slug_idx\` ON \`_pages_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_meta_version_meta_image_idx\` ON \`_pages_v\` (\`version_meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_updated_at_idx\` ON \`_pages_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_created_at_idx\` ON \`_pages_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version__status_idx\` ON \`_pages_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_created_at_idx\` ON \`_pages_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_updated_at_idx\` ON \`_pages_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_latest_idx\` ON \`_pages_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_autosave_idx\` ON \`_pages_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`projects_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`projects_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_order_idx\` ON \`_pages_v_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_parent_idx\` ON \`_pages_v_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_path_idx\` ON \`_pages_v_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_projects_id_idx\` ON \`_pages_v_rels\` (\`projects_id\`);`)
  await db.run(sql`CREATE TABLE \`media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric,
  	\`sizes_thumbnail_url\` text,
  	\`sizes_thumbnail_width\` numeric,
  	\`sizes_thumbnail_height\` numeric,
  	\`sizes_thumbnail_mime_type\` text,
  	\`sizes_thumbnail_filesize\` numeric,
  	\`sizes_thumbnail_filename\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_thumbnail_sizes_thumbnail_filename_idx\` ON \`media\` (\`sizes_thumbnail_filename\`);`)
  await db.run(sql`CREATE TABLE \`inquiries\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`email\` text NOT NULL,
  	\`company\` text,
  	\`budget\` text,
  	\`message\` text NOT NULL,
  	\`status\` text DEFAULT 'new' NOT NULL,
  	\`notes\` text,
  	\`source_page\` text,
  	\`source_user_agent\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`inquiries_updated_at_idx\` ON \`inquiries\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`inquiries_created_at_idx\` ON \`inquiries\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`users_roles\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_roles_order_idx\` ON \`users_roles\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`users_roles_parent_idx\` ON \`users_roles\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`reset_password_requested_at\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`redirects\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`from\` text NOT NULL,
  	\`to_type\` text DEFAULT 'reference',
  	\`to_url\` text,
  	\`type\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`redirects_from_idx\` ON \`redirects\` (\`from\`);`)
  await db.run(sql`CREATE INDEX \`redirects_updated_at_idx\` ON \`redirects\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`redirects_created_at_idx\` ON \`redirects\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`redirects_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pages_id\` integer,
  	\`projects_id\` integer,
  	\`articles_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`redirects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`projects_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`articles_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`redirects_rels_order_idx\` ON \`redirects_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`redirects_rels_parent_idx\` ON \`redirects_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`redirects_rels_path_idx\` ON \`redirects_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`redirects_rels_pages_id_idx\` ON \`redirects_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`redirects_rels_projects_id_idx\` ON \`redirects_rels\` (\`projects_id\`);`)
  await db.run(sql`CREATE INDEX \`redirects_rels_articles_id_idx\` ON \`redirects_rels\` (\`articles_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`projects_id\` integer,
  	\`articles_id\` integer,
  	\`pages_id\` integer,
  	\`media_id\` integer,
  	\`inquiries_id\` integer,
  	\`users_id\` integer,
  	\`redirects_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`projects_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`articles_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`inquiries_id\`) REFERENCES \`inquiries\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`redirects_id\`) REFERENCES \`redirects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_projects_id_idx\` ON \`payload_locked_documents_rels\` (\`projects_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_articles_id_idx\` ON \`payload_locked_documents_rels\` (\`articles_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_inquiries_id_idx\` ON \`payload_locked_documents_rels\` (\`inquiries_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_redirects_id_idx\` ON \`payload_locked_documents_rels\` (\`redirects_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`home_services_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`home_services_items_order_idx\` ON \`home_services_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`home_services_items_parent_id_idx\` ON \`home_services_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`home_mission_features\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`home_mission_features_order_idx\` ON \`home_mission_features\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`home_mission_features_parent_id_idx\` ON \`home_mission_features\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`home_tenets_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`tag\` text,
  	\`body\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`home_tenets_items_order_idx\` ON \`home_tenets_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`home_tenets_items_parent_id_idx\` ON \`home_tenets_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`home_process_steps\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`tag\` text,
  	\`body\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`home_process_steps_order_idx\` ON \`home_process_steps\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`home_process_steps_parent_id_idx\` ON \`home_process_steps\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`home_studio_disciplines\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`role\` text,
  	\`body\` text,
  	\`image_id\` integer,
  	\`href\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`home_studio_disciplines_order_idx\` ON \`home_studio_disciplines\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`home_studio_disciplines_parent_id_idx\` ON \`home_studio_disciplines\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`home_studio_disciplines_image_idx\` ON \`home_studio_disciplines\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`home_pricing_tiers_features\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_pricing_tiers\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`home_pricing_tiers_features_order_idx\` ON \`home_pricing_tiers_features\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`home_pricing_tiers_features_parent_id_idx\` ON \`home_pricing_tiers_features\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`home_pricing_tiers\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`price\` text DEFAULT 'Custom',
  	\`dark\` integer,
  	\`blurb\` text,
  	\`cta_label\` text,
  	\`cta_href\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`home_pricing_tiers_order_idx\` ON \`home_pricing_tiers\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`home_pricing_tiers_parent_id_idx\` ON \`home_pricing_tiers\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`home_faq_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`q\` text,
  	\`a\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`home_faq_items_order_idx\` ON \`home_faq_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`home_faq_items_parent_id_idx\` ON \`home_faq_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`home\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hero_enabled\` integer DEFAULT true,
  	\`hero_title_muted\` text,
  	\`hero_title_main\` text,
  	\`hero_lead\` text,
  	\`hero_cta_label\` text,
  	\`hero_cta_href\` text,
  	\`hero_background_id\` integer,
  	\`hero_card_enabled\` integer DEFAULT true,
  	\`hero_card_title\` text,
  	\`hero_card_subtitle\` text,
  	\`hero_card_href\` text,
  	\`hero_card_image_id\` integer,
  	\`hero_card_frame_id\` integer,
  	\`hero_note\` text,
  	\`hero_show_stack\` integer DEFAULT true,
  	\`intro_enabled\` integer DEFAULT true,
  	\`intro_statement\` text,
  	\`intro_sub\` text,
  	\`intro_projects_value\` text,
  	\`intro_projects_text\` text,
  	\`intro_satisfaction_value\` text,
  	\`intro_satisfaction_label\` text,
  	\`intro_years_value\` text,
  	\`intro_years_text\` text,
  	\`intro_speed_title\` text,
  	\`intro_speed_text\` text,
  	\`intro_quote_text\` text,
  	\`intro_quote_brand\` text,
  	\`intro_quote_by\` text,
  	\`intro_show_ticker\` integer DEFAULT true,
  	\`work_enabled\` integer DEFAULT true,
  	\`work_marquee\` text,
  	\`services_enabled\` integer DEFAULT true,
  	\`services_label\` text,
  	\`services_intro\` text,
  	\`services_title\` text,
  	\`services_cta_label\` text,
  	\`services_cta_href\` text,
  	\`services_texture_id\` integer,
  	\`services_iso_id\` integer,
  	\`mission_enabled\` integer DEFAULT true,
  	\`mission_label\` text,
  	\`mission_statement\` text,
  	\`mission_body\` text,
  	\`mission_models_intro\` text,
  	\`mission_cta_label\` text,
  	\`mission_cta_href\` text,
  	\`tenets_enabled\` integer DEFAULT true,
  	\`tenets_marquee\` text,
  	\`tenets_description\` text,
  	\`tenets_card_footer\` text,
  	\`tenets_show_ticker\` integer DEFAULT true,
  	\`showcase_enabled\` integer DEFAULT true,
  	\`showcase_image_id\` integer,
  	\`showcase_lead\` text,
  	\`showcase_pill\` text,
  	\`showcase_title\` text,
  	\`process_enabled\` integer DEFAULT true,
  	\`process_label\` text,
  	\`process_title\` text,
  	\`process_texture_id\` integer,
  	\`process_iso_id\` integer,
  	\`process_closing\` text,
  	\`process_cta_label\` text,
  	\`process_cta_href\` text,
  	\`studio_enabled\` integer DEFAULT true,
  	\`studio_statement\` text,
  	\`studio_intro\` text,
  	\`studio_cta_label\` text,
  	\`studio_cta_href\` text,
  	\`studio_explore_label\` text,
  	\`pricing_enabled\` integer DEFAULT true,
  	\`pricing_marquee\` text,
  	\`pricing_intro\` text,
  	\`pricing_billing_left\` text,
  	\`pricing_billing_right\` text,
  	\`pricing_billing_hint\` text,
  	\`pricing_billing_left_note\` text,
  	\`pricing_billing_right_note\` text,
  	\`pricing_card_image_id\` integer,
  	\`pricing_show_ticker\` integer DEFAULT true,
  	\`faq_enabled\` integer DEFAULT true,
  	\`faq_label\` text,
  	\`faq_sub\` text,
  	\`faq_title\` text,
  	\`faq_cta_label\` text,
  	\`faq_cta_href\` text,
  	\`journal_enabled\` integer DEFAULT true,
  	\`journal_marquee\` text,
  	\`journal_intro\` text,
  	\`journal_cta_label\` text,
  	\`journal_cta_href\` text,
  	\`journal_count\` numeric DEFAULT 3,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`meta_image_id\` integer,
  	\`_status\` text DEFAULT 'draft',
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`hero_background_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`hero_card_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`hero_card_frame_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`services_texture_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`services_iso_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`showcase_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`process_texture_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`process_iso_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`pricing_card_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`home_hero_hero_background_idx\` ON \`home\` (\`hero_background_id\`);`)
  await db.run(sql`CREATE INDEX \`home_hero_card_hero_card_image_idx\` ON \`home\` (\`hero_card_image_id\`);`)
  await db.run(sql`CREATE INDEX \`home_hero_card_hero_card_frame_idx\` ON \`home\` (\`hero_card_frame_id\`);`)
  await db.run(sql`CREATE INDEX \`home_services_services_texture_idx\` ON \`home\` (\`services_texture_id\`);`)
  await db.run(sql`CREATE INDEX \`home_services_services_iso_idx\` ON \`home\` (\`services_iso_id\`);`)
  await db.run(sql`CREATE INDEX \`home_showcase_showcase_image_idx\` ON \`home\` (\`showcase_image_id\`);`)
  await db.run(sql`CREATE INDEX \`home_process_process_texture_idx\` ON \`home\` (\`process_texture_id\`);`)
  await db.run(sql`CREATE INDEX \`home_process_process_iso_idx\` ON \`home\` (\`process_iso_id\`);`)
  await db.run(sql`CREATE INDEX \`home_pricing_pricing_card_image_idx\` ON \`home\` (\`pricing_card_image_id\`);`)
  await db.run(sql`CREATE INDEX \`home_meta_meta_image_idx\` ON \`home\` (\`meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`home__status_idx\` ON \`home\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`home_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`projects_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`home\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`projects_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`home_rels_order_idx\` ON \`home_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`home_rels_parent_idx\` ON \`home_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`home_rels_path_idx\` ON \`home_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`home_rels_projects_id_idx\` ON \`home_rels\` (\`projects_id\`);`)
  await db.run(sql`CREATE TABLE \`_home_v_version_services_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_home_v_version_services_items_order_idx\` ON \`_home_v_version_services_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_version_services_items_parent_id_idx\` ON \`_home_v_version_services_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_home_v_version_mission_features\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_home_v_version_mission_features_order_idx\` ON \`_home_v_version_mission_features\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_version_mission_features_parent_id_idx\` ON \`_home_v_version_mission_features\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_home_v_version_tenets_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`tag\` text,
  	\`body\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_home_v_version_tenets_items_order_idx\` ON \`_home_v_version_tenets_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_version_tenets_items_parent_id_idx\` ON \`_home_v_version_tenets_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_home_v_version_process_steps\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`tag\` text,
  	\`body\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_home_v_version_process_steps_order_idx\` ON \`_home_v_version_process_steps\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_version_process_steps_parent_id_idx\` ON \`_home_v_version_process_steps\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_home_v_version_studio_disciplines\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`role\` text,
  	\`body\` text,
  	\`image_id\` integer,
  	\`href\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_home_v_version_studio_disciplines_order_idx\` ON \`_home_v_version_studio_disciplines\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_version_studio_disciplines_parent_id_idx\` ON \`_home_v_version_studio_disciplines\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_version_studio_disciplines_image_idx\` ON \`_home_v_version_studio_disciplines\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_home_v_version_pricing_tiers_features\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_v_version_pricing_tiers\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_home_v_version_pricing_tiers_features_order_idx\` ON \`_home_v_version_pricing_tiers_features\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_version_pricing_tiers_features_parent_id_idx\` ON \`_home_v_version_pricing_tiers_features\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_home_v_version_pricing_tiers\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`price\` text DEFAULT 'Custom',
  	\`dark\` integer,
  	\`blurb\` text,
  	\`cta_label\` text,
  	\`cta_href\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_home_v_version_pricing_tiers_order_idx\` ON \`_home_v_version_pricing_tiers\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_version_pricing_tiers_parent_id_idx\` ON \`_home_v_version_pricing_tiers\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_home_v_version_faq_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`q\` text,
  	\`a\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_home_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_home_v_version_faq_items_order_idx\` ON \`_home_v_version_faq_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_version_faq_items_parent_id_idx\` ON \`_home_v_version_faq_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_home_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_hero_enabled\` integer DEFAULT true,
  	\`version_hero_title_muted\` text,
  	\`version_hero_title_main\` text,
  	\`version_hero_lead\` text,
  	\`version_hero_cta_label\` text,
  	\`version_hero_cta_href\` text,
  	\`version_hero_background_id\` integer,
  	\`version_hero_card_enabled\` integer DEFAULT true,
  	\`version_hero_card_title\` text,
  	\`version_hero_card_subtitle\` text,
  	\`version_hero_card_href\` text,
  	\`version_hero_card_image_id\` integer,
  	\`version_hero_card_frame_id\` integer,
  	\`version_hero_note\` text,
  	\`version_hero_show_stack\` integer DEFAULT true,
  	\`version_intro_enabled\` integer DEFAULT true,
  	\`version_intro_statement\` text,
  	\`version_intro_sub\` text,
  	\`version_intro_projects_value\` text,
  	\`version_intro_projects_text\` text,
  	\`version_intro_satisfaction_value\` text,
  	\`version_intro_satisfaction_label\` text,
  	\`version_intro_years_value\` text,
  	\`version_intro_years_text\` text,
  	\`version_intro_speed_title\` text,
  	\`version_intro_speed_text\` text,
  	\`version_intro_quote_text\` text,
  	\`version_intro_quote_brand\` text,
  	\`version_intro_quote_by\` text,
  	\`version_intro_show_ticker\` integer DEFAULT true,
  	\`version_work_enabled\` integer DEFAULT true,
  	\`version_work_marquee\` text,
  	\`version_services_enabled\` integer DEFAULT true,
  	\`version_services_label\` text,
  	\`version_services_intro\` text,
  	\`version_services_title\` text,
  	\`version_services_cta_label\` text,
  	\`version_services_cta_href\` text,
  	\`version_services_texture_id\` integer,
  	\`version_services_iso_id\` integer,
  	\`version_mission_enabled\` integer DEFAULT true,
  	\`version_mission_label\` text,
  	\`version_mission_statement\` text,
  	\`version_mission_body\` text,
  	\`version_mission_models_intro\` text,
  	\`version_mission_cta_label\` text,
  	\`version_mission_cta_href\` text,
  	\`version_tenets_enabled\` integer DEFAULT true,
  	\`version_tenets_marquee\` text,
  	\`version_tenets_description\` text,
  	\`version_tenets_card_footer\` text,
  	\`version_tenets_show_ticker\` integer DEFAULT true,
  	\`version_showcase_enabled\` integer DEFAULT true,
  	\`version_showcase_image_id\` integer,
  	\`version_showcase_lead\` text,
  	\`version_showcase_pill\` text,
  	\`version_showcase_title\` text,
  	\`version_process_enabled\` integer DEFAULT true,
  	\`version_process_label\` text,
  	\`version_process_title\` text,
  	\`version_process_texture_id\` integer,
  	\`version_process_iso_id\` integer,
  	\`version_process_closing\` text,
  	\`version_process_cta_label\` text,
  	\`version_process_cta_href\` text,
  	\`version_studio_enabled\` integer DEFAULT true,
  	\`version_studio_statement\` text,
  	\`version_studio_intro\` text,
  	\`version_studio_cta_label\` text,
  	\`version_studio_cta_href\` text,
  	\`version_studio_explore_label\` text,
  	\`version_pricing_enabled\` integer DEFAULT true,
  	\`version_pricing_marquee\` text,
  	\`version_pricing_intro\` text,
  	\`version_pricing_billing_left\` text,
  	\`version_pricing_billing_right\` text,
  	\`version_pricing_billing_hint\` text,
  	\`version_pricing_billing_left_note\` text,
  	\`version_pricing_billing_right_note\` text,
  	\`version_pricing_card_image_id\` integer,
  	\`version_pricing_show_ticker\` integer DEFAULT true,
  	\`version_faq_enabled\` integer DEFAULT true,
  	\`version_faq_label\` text,
  	\`version_faq_sub\` text,
  	\`version_faq_title\` text,
  	\`version_faq_cta_label\` text,
  	\`version_faq_cta_href\` text,
  	\`version_journal_enabled\` integer DEFAULT true,
  	\`version_journal_marquee\` text,
  	\`version_journal_intro\` text,
  	\`version_journal_cta_label\` text,
  	\`version_journal_cta_href\` text,
  	\`version_journal_count\` numeric DEFAULT 3,
  	\`version_meta_title\` text,
  	\`version_meta_description\` text,
  	\`version_meta_image_id\` integer,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`version_hero_background_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_hero_card_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_hero_card_frame_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_services_texture_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_services_iso_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_showcase_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_process_texture_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_process_iso_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_pricing_card_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_home_v_version_hero_version_hero_background_idx\` ON \`_home_v\` (\`version_hero_background_id\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_version_hero_card_version_hero_card_image_idx\` ON \`_home_v\` (\`version_hero_card_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_version_hero_card_version_hero_card_frame_idx\` ON \`_home_v\` (\`version_hero_card_frame_id\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_version_services_version_services_texture_idx\` ON \`_home_v\` (\`version_services_texture_id\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_version_services_version_services_iso_idx\` ON \`_home_v\` (\`version_services_iso_id\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_version_showcase_version_showcase_image_idx\` ON \`_home_v\` (\`version_showcase_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_version_process_version_process_texture_idx\` ON \`_home_v\` (\`version_process_texture_id\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_version_process_version_process_iso_idx\` ON \`_home_v\` (\`version_process_iso_id\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_version_pricing_version_pricing_card_image_idx\` ON \`_home_v\` (\`version_pricing_card_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_version_meta_version_meta_image_idx\` ON \`_home_v\` (\`version_meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_version_version__status_idx\` ON \`_home_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_created_at_idx\` ON \`_home_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_updated_at_idx\` ON \`_home_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_latest_idx\` ON \`_home_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_autosave_idx\` ON \`_home_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`_home_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`projects_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_home_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`projects_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_home_v_rels_order_idx\` ON \`_home_v_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_rels_parent_idx\` ON \`_home_v_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_rels_path_idx\` ON \`_home_v_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`_home_v_rels_projects_id_idx\` ON \`_home_v_rels\` (\`projects_id\`);`)
  await db.run(sql`CREATE TABLE \`about_mosaic\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`about\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`about_mosaic_order_idx\` ON \`about_mosaic\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`about_mosaic_parent_id_idx\` ON \`about_mosaic\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`about_mosaic_image_idx\` ON \`about_mosaic\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`about_story_paragraphs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`about\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`about_story_paragraphs_order_idx\` ON \`about_story_paragraphs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`about_story_paragraphs_parent_id_idx\` ON \`about_story_paragraphs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`about_crafts_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	\`shape\` text DEFAULT 'blocks',
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`about\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`about_crafts_cards_order_idx\` ON \`about_crafts_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`about_crafts_cards_parent_id_idx\` ON \`about_crafts_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`about\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hero_title\` text,
  	\`hero_lead\` text,
  	\`hero_cta_label\` text,
  	\`hero_cta_href\` text,
  	\`story_enabled\` integer DEFAULT true,
  	\`story_label\` text,
  	\`story_title\` text,
  	\`story_cta_label\` text,
  	\`story_cta_href\` text,
  	\`story_show_stats\` integer DEFAULT true,
  	\`crafts_enabled\` integer DEFAULT true,
  	\`crafts_label\` text,
  	\`crafts_statement\` text,
  	\`crafts_lead\` text,
  	\`crafts_show_stack\` integer DEFAULT true,
  	\`show_tenets\` integer DEFAULT true,
  	\`show_faq\` integer DEFAULT true,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`meta_image_id\` integer,
  	\`_status\` text DEFAULT 'draft',
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`about_meta_meta_image_idx\` ON \`about\` (\`meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`about__status_idx\` ON \`about\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_about_v_version_mosaic\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_about_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_about_v_version_mosaic_order_idx\` ON \`_about_v_version_mosaic\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_about_v_version_mosaic_parent_id_idx\` ON \`_about_v_version_mosaic\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_about_v_version_mosaic_image_idx\` ON \`_about_v_version_mosaic\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_about_v_version_story_paragraphs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_about_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_about_v_version_story_paragraphs_order_idx\` ON \`_about_v_version_story_paragraphs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_about_v_version_story_paragraphs_parent_id_idx\` ON \`_about_v_version_story_paragraphs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_about_v_version_crafts_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	\`shape\` text DEFAULT 'blocks',
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_about_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_about_v_version_crafts_cards_order_idx\` ON \`_about_v_version_crafts_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_about_v_version_crafts_cards_parent_id_idx\` ON \`_about_v_version_crafts_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_about_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_hero_title\` text,
  	\`version_hero_lead\` text,
  	\`version_hero_cta_label\` text,
  	\`version_hero_cta_href\` text,
  	\`version_story_enabled\` integer DEFAULT true,
  	\`version_story_label\` text,
  	\`version_story_title\` text,
  	\`version_story_cta_label\` text,
  	\`version_story_cta_href\` text,
  	\`version_story_show_stats\` integer DEFAULT true,
  	\`version_crafts_enabled\` integer DEFAULT true,
  	\`version_crafts_label\` text,
  	\`version_crafts_statement\` text,
  	\`version_crafts_lead\` text,
  	\`version_crafts_show_stack\` integer DEFAULT true,
  	\`version_show_tenets\` integer DEFAULT true,
  	\`version_show_faq\` integer DEFAULT true,
  	\`version_meta_title\` text,
  	\`version_meta_description\` text,
  	\`version_meta_image_id\` integer,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_about_v_version_meta_version_meta_image_idx\` ON \`_about_v\` (\`version_meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_about_v_version_version__status_idx\` ON \`_about_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_about_v_created_at_idx\` ON \`_about_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_about_v_updated_at_idx\` ON \`_about_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_about_v_latest_idx\` ON \`_about_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_about_v_autosave_idx\` ON \`_about_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`services_page_list_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`services_page\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`services_page_list_items_order_idx\` ON \`services_page_list_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`services_page_list_items_parent_id_idx\` ON \`services_page_list_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`services_page\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hero_eyebrow\` text,
  	\`hero_title\` text,
  	\`hero_lead\` text,
  	\`hero_cta_label\` text,
  	\`hero_cta_href\` text,
  	\`show_accordion\` integer DEFAULT true,
  	\`show_process\` integer DEFAULT true,
  	\`list_enabled\` integer DEFAULT true,
  	\`list_title\` text,
  	\`show_faq\` integer DEFAULT true,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`meta_image_id\` integer,
  	\`_status\` text DEFAULT 'draft',
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`services_page_meta_meta_image_idx\` ON \`services_page\` (\`meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`services_page__status_idx\` ON \`services_page\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_services_page_v_version_list_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_services_page_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_services_page_v_version_list_items_order_idx\` ON \`_services_page_v_version_list_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_services_page_v_version_list_items_parent_id_idx\` ON \`_services_page_v_version_list_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_services_page_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_hero_eyebrow\` text,
  	\`version_hero_title\` text,
  	\`version_hero_lead\` text,
  	\`version_hero_cta_label\` text,
  	\`version_hero_cta_href\` text,
  	\`version_show_accordion\` integer DEFAULT true,
  	\`version_show_process\` integer DEFAULT true,
  	\`version_list_enabled\` integer DEFAULT true,
  	\`version_list_title\` text,
  	\`version_show_faq\` integer DEFAULT true,
  	\`version_meta_title\` text,
  	\`version_meta_description\` text,
  	\`version_meta_image_id\` integer,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_services_page_v_version_meta_version_meta_image_idx\` ON \`_services_page_v\` (\`version_meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_services_page_v_version_version__status_idx\` ON \`_services_page_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_services_page_v_created_at_idx\` ON \`_services_page_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_services_page_v_updated_at_idx\` ON \`_services_page_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_services_page_v_latest_idx\` ON \`_services_page_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_services_page_v_autosave_idx\` ON \`_services_page_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`work_page\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`marquee\` text,
  	\`note\` text,
  	\`products_label\` text,
  	\`clients_label\` text,
  	\`case_study_product_kicker\` text,
  	\`case_study_case_kicker\` text,
  	\`case_study_next_product\` text,
  	\`case_study_next_case\` text,
  	\`case_study_cta_title\` text,
  	\`case_study_cta_label\` text,
  	\`case_study_cta_href\` text,
  	\`show_faq\` integer DEFAULT true,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`meta_image_id\` integer,
  	\`_status\` text DEFAULT 'draft',
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`work_page_image_idx\` ON \`work_page\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`work_page_meta_meta_image_idx\` ON \`work_page\` (\`meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`work_page__status_idx\` ON \`work_page\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_work_page_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_image_id\` integer,
  	\`version_marquee\` text,
  	\`version_note\` text,
  	\`version_products_label\` text,
  	\`version_clients_label\` text,
  	\`version_case_study_product_kicker\` text,
  	\`version_case_study_case_kicker\` text,
  	\`version_case_study_next_product\` text,
  	\`version_case_study_next_case\` text,
  	\`version_case_study_cta_title\` text,
  	\`version_case_study_cta_label\` text,
  	\`version_case_study_cta_href\` text,
  	\`version_show_faq\` integer DEFAULT true,
  	\`version_meta_title\` text,
  	\`version_meta_description\` text,
  	\`version_meta_image_id\` integer,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`version_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_work_page_v_version_version_image_idx\` ON \`_work_page_v\` (\`version_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_work_page_v_version_meta_version_meta_image_idx\` ON \`_work_page_v\` (\`version_meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_work_page_v_version_version__status_idx\` ON \`_work_page_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_work_page_v_created_at_idx\` ON \`_work_page_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_work_page_v_updated_at_idx\` ON \`_work_page_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_work_page_v_latest_idx\` ON \`_work_page_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_work_page_v_autosave_idx\` ON \`_work_page_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`journal_page\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`marquee\` text,
  	\`intro\` text,
  	\`post_author_label\` text,
  	\`post_date_label\` text,
  	\`post_by_label\` text,
  	\`post_more_title\` text,
  	\`post_cta_label\` text,
  	\`post_cta_href\` text,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`meta_image_id\` integer,
  	\`_status\` text DEFAULT 'draft',
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`journal_page_meta_meta_image_idx\` ON \`journal_page\` (\`meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`journal_page__status_idx\` ON \`journal_page\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_journal_page_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_marquee\` text,
  	\`version_intro\` text,
  	\`version_post_author_label\` text,
  	\`version_post_date_label\` text,
  	\`version_post_by_label\` text,
  	\`version_post_more_title\` text,
  	\`version_post_cta_label\` text,
  	\`version_post_cta_href\` text,
  	\`version_meta_title\` text,
  	\`version_meta_description\` text,
  	\`version_meta_image_id\` integer,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_journal_page_v_version_meta_version_meta_image_idx\` ON \`_journal_page_v\` (\`version_meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_journal_page_v_version_version__status_idx\` ON \`_journal_page_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_journal_page_v_created_at_idx\` ON \`_journal_page_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_journal_page_v_updated_at_idx\` ON \`_journal_page_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_journal_page_v_latest_idx\` ON \`_journal_page_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_journal_page_v_autosave_idx\` ON \`_journal_page_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`contact_page_split_form_budgets\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`contact_page\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`contact_page_split_form_budgets_order_idx\` ON \`contact_page_split_form_budgets\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`contact_page_split_form_budgets_parent_id_idx\` ON \`contact_page_split_form_budgets\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`contact_page\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`split_title\` text,
  	\`split_lead\` text,
  	\`split_image_id\` integer,
  	\`split_visual_title\` text,
  	\`split_form_name_label\` text,
  	\`split_form_name_placeholder\` text,
  	\`split_form_email_label\` text,
  	\`split_form_email_placeholder\` text,
  	\`split_form_budget_label\` text,
  	\`split_form_message_label\` text,
  	\`split_form_message_placeholder\` text,
  	\`split_form_submit_label\` text,
  	\`split_form_success_message\` text,
  	\`split_form_error_message\` text,
  	\`call_enabled\` integer DEFAULT true,
  	\`call_image_id\` integer,
  	\`call_label\` text,
  	\`call_title\` text,
  	\`call_body\` text,
  	\`call_show_socials\` integer DEFAULT true,
  	\`call_cta_label\` text,
  	\`call_cta_href\` text,
  	\`show_faq\` integer DEFAULT true,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`meta_image_id\` integer,
  	\`_status\` text DEFAULT 'draft',
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`split_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`call_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`contact_page_split_split_image_idx\` ON \`contact_page\` (\`split_image_id\`);`)
  await db.run(sql`CREATE INDEX \`contact_page_call_call_image_idx\` ON \`contact_page\` (\`call_image_id\`);`)
  await db.run(sql`CREATE INDEX \`contact_page_meta_meta_image_idx\` ON \`contact_page\` (\`meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`contact_page__status_idx\` ON \`contact_page\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_contact_page_v_version_split_form_budgets\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_contact_page_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_contact_page_v_version_split_form_budgets_order_idx\` ON \`_contact_page_v_version_split_form_budgets\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_contact_page_v_version_split_form_budgets_parent_id_idx\` ON \`_contact_page_v_version_split_form_budgets\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_contact_page_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_split_title\` text,
  	\`version_split_lead\` text,
  	\`version_split_image_id\` integer,
  	\`version_split_visual_title\` text,
  	\`version_split_form_name_label\` text,
  	\`version_split_form_name_placeholder\` text,
  	\`version_split_form_email_label\` text,
  	\`version_split_form_email_placeholder\` text,
  	\`version_split_form_budget_label\` text,
  	\`version_split_form_message_label\` text,
  	\`version_split_form_message_placeholder\` text,
  	\`version_split_form_submit_label\` text,
  	\`version_split_form_success_message\` text,
  	\`version_split_form_error_message\` text,
  	\`version_call_enabled\` integer DEFAULT true,
  	\`version_call_image_id\` integer,
  	\`version_call_label\` text,
  	\`version_call_title\` text,
  	\`version_call_body\` text,
  	\`version_call_show_socials\` integer DEFAULT true,
  	\`version_call_cta_label\` text,
  	\`version_call_cta_href\` text,
  	\`version_show_faq\` integer DEFAULT true,
  	\`version_meta_title\` text,
  	\`version_meta_description\` text,
  	\`version_meta_image_id\` integer,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`version_split_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_call_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_contact_page_v_version_split_version_split_image_idx\` ON \`_contact_page_v\` (\`version_split_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_contact_page_v_version_call_version_call_image_idx\` ON \`_contact_page_v\` (\`version_call_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_contact_page_v_version_meta_version_meta_image_idx\` ON \`_contact_page_v\` (\`version_meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_contact_page_v_version_version__status_idx\` ON \`_contact_page_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_contact_page_v_created_at_idx\` ON \`_contact_page_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_contact_page_v_updated_at_idx\` ON \`_contact_page_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_contact_page_v_latest_idx\` ON \`_contact_page_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_contact_page_v_autosave_idx\` ON \`_contact_page_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`navigation_header_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`href\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`navigation\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`navigation_header_links_order_idx\` ON \`navigation_header_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`navigation_header_links_parent_id_idx\` ON \`navigation_header_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`navigation_footer_columns_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`href\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`navigation_footer_columns\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`navigation_footer_columns_links_order_idx\` ON \`navigation_footer_columns_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`navigation_footer_columns_links_parent_id_idx\` ON \`navigation_footer_columns_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`navigation_footer_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`navigation\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`navigation_footer_columns_order_idx\` ON \`navigation_footer_columns\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`navigation_footer_columns_parent_id_idx\` ON \`navigation_footer_columns\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`navigation\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`header_show_hire\` integer DEFAULT true,
  	\`header_hire_label\` text,
  	\`header_hire_href\` text,
  	\`footer_background_id\` integer,
  	\`footer_blurb\` text,
  	\`footer_cta_label\` text,
  	\`footer_cta_href\` text,
  	\`footer_follow_label\` text,
  	\`footer_copyright\` text,
  	\`footer_show_wordmark\` integer DEFAULT true,
  	\`_status\` text DEFAULT 'draft',
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`footer_background_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`navigation_footer_footer_background_idx\` ON \`navigation\` (\`footer_background_id\`);`)
  await db.run(sql`CREATE INDEX \`navigation__status_idx\` ON \`navigation\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_navigation_v_version_header_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`href\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_navigation_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_navigation_v_version_header_links_order_idx\` ON \`_navigation_v_version_header_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_navigation_v_version_header_links_parent_id_idx\` ON \`_navigation_v_version_header_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_navigation_v_version_footer_columns_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`href\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_navigation_v_version_footer_columns\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_navigation_v_version_footer_columns_links_order_idx\` ON \`_navigation_v_version_footer_columns_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_navigation_v_version_footer_columns_links_parent_id_idx\` ON \`_navigation_v_version_footer_columns_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_navigation_v_version_footer_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_navigation_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_navigation_v_version_footer_columns_order_idx\` ON \`_navigation_v_version_footer_columns\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_navigation_v_version_footer_columns_parent_id_idx\` ON \`_navigation_v_version_footer_columns\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_navigation_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_header_show_hire\` integer DEFAULT true,
  	\`version_header_hire_label\` text,
  	\`version_header_hire_href\` text,
  	\`version_footer_background_id\` integer,
  	\`version_footer_blurb\` text,
  	\`version_footer_cta_label\` text,
  	\`version_footer_cta_href\` text,
  	\`version_footer_follow_label\` text,
  	\`version_footer_copyright\` text,
  	\`version_footer_show_wordmark\` integer DEFAULT true,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`version_footer_background_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_navigation_v_version_footer_version_footer_background_idx\` ON \`_navigation_v\` (\`version_footer_background_id\`);`)
  await db.run(sql`CREATE INDEX \`_navigation_v_version_version__status_idx\` ON \`_navigation_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_navigation_v_created_at_idx\` ON \`_navigation_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_navigation_v_updated_at_idx\` ON \`_navigation_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_navigation_v_latest_idx\` ON \`_navigation_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_navigation_v_autosave_idx\` ON \`_navigation_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`site_stats\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	\`label\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`site\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`site_stats_order_idx\` ON \`site_stats\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`site_stats_parent_id_idx\` ON \`site_stats\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`site_stack\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`site\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`site_stack_order_idx\` ON \`site_stack\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`site_stack_parent_id_idx\` ON \`site_stack\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`site_socials\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`icon\` text NOT NULL,
  	\`href\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`site\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`site_socials_order_idx\` ON \`site_socials\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`site_socials_parent_id_idx\` ON \`site_socials\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`site\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`legal_name\` text NOT NULL,
  	\`url\` text NOT NULL,
  	\`founder_name\` text,
  	\`founder_alias\` text,
  	\`founder_role\` text,
  	\`founder_photo_id\` integer,
  	\`founder_monogram\` text,
  	\`email\` text NOT NULL,
  	\`location\` text,
  	\`phone\` text,
  	\`phone_href\` text,
  	\`ticker_enabled\` integer DEFAULT true,
  	\`ticker_tag\` text,
  	\`ticker_message\` text,
  	\`title\` text NOT NULL,
  	\`title_template\` text DEFAULT '%s | Jomiez' NOT NULL,
  	\`description\` text NOT NULL,
  	\`og_image_id\` integer,
  	\`notifications_to\` text,
  	\`notifications_auto_reply\` integer DEFAULT true,
  	\`notifications_auto_reply_subject\` text,
  	\`notifications_auto_reply_body\` text,
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`founder_photo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`site_founder_founder_photo_idx\` ON \`site\` (\`founder_photo_id\`);`)
  await db.run(sql`CREATE INDEX \`site_og_image_idx\` ON \`site\` (\`og_image_id\`);`)
  await db.run(sql`CREATE TABLE \`site_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`site\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`site_rels_order_idx\` ON \`site_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`site_rels_parent_idx\` ON \`site_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`site_rels_path_idx\` ON \`site_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`site_rels_media_id_idx\` ON \`site_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE TABLE \`_site_v_version_stats\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	\`label\` text NOT NULL,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_site_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_site_v_version_stats_order_idx\` ON \`_site_v_version_stats\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_site_v_version_stats_parent_id_idx\` ON \`_site_v_version_stats\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_site_v_version_stack\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text NOT NULL,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_site_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_site_v_version_stack_order_idx\` ON \`_site_v_version_stack\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_site_v_version_stack_parent_id_idx\` ON \`_site_v_version_stack\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_site_v_version_socials\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`icon\` text NOT NULL,
  	\`href\` text NOT NULL,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_site_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_site_v_version_socials_order_idx\` ON \`_site_v_version_socials\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_site_v_version_socials_parent_id_idx\` ON \`_site_v_version_socials\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_site_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_name\` text NOT NULL,
  	\`version_legal_name\` text NOT NULL,
  	\`version_url\` text NOT NULL,
  	\`version_founder_name\` text,
  	\`version_founder_alias\` text,
  	\`version_founder_role\` text,
  	\`version_founder_photo_id\` integer,
  	\`version_founder_monogram\` text,
  	\`version_email\` text NOT NULL,
  	\`version_location\` text,
  	\`version_phone\` text,
  	\`version_phone_href\` text,
  	\`version_ticker_enabled\` integer DEFAULT true,
  	\`version_ticker_tag\` text,
  	\`version_ticker_message\` text,
  	\`version_title\` text NOT NULL,
  	\`version_title_template\` text DEFAULT '%s | Jomiez' NOT NULL,
  	\`version_description\` text NOT NULL,
  	\`version_og_image_id\` integer,
  	\`version_notifications_to\` text,
  	\`version_notifications_auto_reply\` integer DEFAULT true,
  	\`version_notifications_auto_reply_subject\` text,
  	\`version_notifications_auto_reply_body\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`version_founder_photo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_site_v_version_founder_version_founder_photo_idx\` ON \`_site_v\` (\`version_founder_photo_id\`);`)
  await db.run(sql`CREATE INDEX \`_site_v_version_version_og_image_idx\` ON \`_site_v\` (\`version_og_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_site_v_created_at_idx\` ON \`_site_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_site_v_updated_at_idx\` ON \`_site_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE TABLE \`_site_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_site_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_site_v_rels_order_idx\` ON \`_site_v_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_site_v_rels_parent_idx\` ON \`_site_v_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_site_v_rels_path_idx\` ON \`_site_v_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`_site_v_rels_media_id_idx\` ON \`_site_v_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE TABLE \`effects\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`cursor_lens\` integer DEFAULT true,
  	\`lens_size\` numeric DEFAULT 132,
  	\`nav_glass\` integer DEFAULT true,
  	\`footer_glass\` integer DEFAULT true,
  	\`hero_dew\` integer DEFAULT true,
  	\`page_transitions\` integer DEFAULT true,
  	\`smooth_scroll\` integer DEFAULT true,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`_effects_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_cursor_lens\` integer DEFAULT true,
  	\`version_lens_size\` numeric DEFAULT 132,
  	\`version_nav_glass\` integer DEFAULT true,
  	\`version_footer_glass\` integer DEFAULT true,
  	\`version_hero_dew\` integer DEFAULT true,
  	\`version_page_transitions\` integer DEFAULT true,
  	\`version_smooth_scroll\` integer DEFAULT true,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`_effects_v_created_at_idx\` ON \`_effects_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_effects_v_updated_at_idx\` ON \`_effects_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE TABLE \`not_found\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	\`cta_label\` text,
  	\`cta_href\` text,
  	\`_status\` text DEFAULT 'draft',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`not_found__status_idx\` ON \`not_found\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_not_found_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_title\` text,
  	\`version_body\` text,
  	\`version_cta_label\` text,
  	\`version_cta_href\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer
  );
  `)
  await db.run(sql`CREATE INDEX \`_not_found_v_version_version__status_idx\` ON \`_not_found_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_not_found_v_created_at_idx\` ON \`_not_found_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_not_found_v_updated_at_idx\` ON \`_not_found_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_not_found_v_latest_idx\` ON \`_not_found_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_not_found_v_autosave_idx\` ON \`_not_found_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`privacy_sections_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`privacy_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`privacy_sections_items_order_idx\` ON \`privacy_sections_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`privacy_sections_items_parent_id_idx\` ON \`privacy_sections_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`privacy_sections\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	\`intro\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`privacy\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`privacy_sections_order_idx\` ON \`privacy_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`privacy_sections_parent_id_idx\` ON \`privacy_sections\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`privacy\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`intro\` text,
  	\`contact_note\` integer DEFAULT true,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`meta_image_id\` integer,
  	\`_status\` text DEFAULT 'draft',
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`privacy_meta_meta_image_idx\` ON \`privacy\` (\`meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`privacy__status_idx\` ON \`privacy\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_privacy_v_version_sections_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_privacy_v_version_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_privacy_v_version_sections_items_order_idx\` ON \`_privacy_v_version_sections_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_privacy_v_version_sections_items_parent_id_idx\` ON \`_privacy_v_version_sections_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_privacy_v_version_sections\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	\`intro\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_privacy_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_privacy_v_version_sections_order_idx\` ON \`_privacy_v_version_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_privacy_v_version_sections_parent_id_idx\` ON \`_privacy_v_version_sections\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_privacy_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_title\` text,
  	\`version_intro\` text,
  	\`version_contact_note\` integer DEFAULT true,
  	\`version_meta_title\` text,
  	\`version_meta_description\` text,
  	\`version_meta_image_id\` integer,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_privacy_v_version_meta_version_meta_image_idx\` ON \`_privacy_v\` (\`version_meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_privacy_v_version_version__status_idx\` ON \`_privacy_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_privacy_v_created_at_idx\` ON \`_privacy_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_privacy_v_updated_at_idx\` ON \`_privacy_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_privacy_v_latest_idx\` ON \`_privacy_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_privacy_v_autosave_idx\` ON \`_privacy_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`terms_sections_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`terms_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`terms_sections_items_order_idx\` ON \`terms_sections_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`terms_sections_items_parent_id_idx\` ON \`terms_sections_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`terms_sections\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	\`intro\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`terms\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`terms_sections_order_idx\` ON \`terms_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`terms_sections_parent_id_idx\` ON \`terms_sections\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`terms\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`intro\` text,
  	\`contact_note\` integer DEFAULT true,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`meta_image_id\` integer,
  	\`_status\` text DEFAULT 'draft',
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`terms_meta_meta_image_idx\` ON \`terms\` (\`meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`terms__status_idx\` ON \`terms\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_terms_v_version_sections_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_terms_v_version_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_terms_v_version_sections_items_order_idx\` ON \`_terms_v_version_sections_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_terms_v_version_sections_items_parent_id_idx\` ON \`_terms_v_version_sections_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_terms_v_version_sections\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	\`intro\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_terms_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_terms_v_version_sections_order_idx\` ON \`_terms_v_version_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_terms_v_version_sections_parent_id_idx\` ON \`_terms_v_version_sections\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_terms_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_title\` text,
  	\`version_intro\` text,
  	\`version_contact_note\` integer DEFAULT true,
  	\`version_meta_title\` text,
  	\`version_meta_description\` text,
  	\`version_meta_image_id\` integer,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_terms_v_version_meta_version_meta_image_idx\` ON \`_terms_v\` (\`version_meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_terms_v_version_version__status_idx\` ON \`_terms_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_terms_v_created_at_idx\` ON \`_terms_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_terms_v_updated_at_idx\` ON \`_terms_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_terms_v_latest_idx\` ON \`_terms_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_terms_v_autosave_idx\` ON \`_terms_v\` (\`autosave\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`projects_services\`;`)
  await db.run(sql`DROP TABLE \`projects_stats\`;`)
  await db.run(sql`DROP TABLE \`projects_sections_points\`;`)
  await db.run(sql`DROP TABLE \`projects_sections\`;`)
  await db.run(sql`DROP TABLE \`projects_product_page_stats\`;`)
  await db.run(sql`DROP TABLE \`projects_product_page_cards\`;`)
  await db.run(sql`DROP TABLE \`projects_product_page_system_features\`;`)
  await db.run(sql`DROP TABLE \`projects_product_page_faq_items\`;`)
  await db.run(sql`DROP TABLE \`projects\`;`)
  await db.run(sql`DROP TABLE \`_projects_v_version_services\`;`)
  await db.run(sql`DROP TABLE \`_projects_v_version_stats\`;`)
  await db.run(sql`DROP TABLE \`_projects_v_version_sections_points\`;`)
  await db.run(sql`DROP TABLE \`_projects_v_version_sections\`;`)
  await db.run(sql`DROP TABLE \`_projects_v_version_product_page_stats\`;`)
  await db.run(sql`DROP TABLE \`_projects_v_version_product_page_cards\`;`)
  await db.run(sql`DROP TABLE \`_projects_v_version_product_page_system_features\`;`)
  await db.run(sql`DROP TABLE \`_projects_v_version_product_page_faq_items\`;`)
  await db.run(sql`DROP TABLE \`_projects_v\`;`)
  await db.run(sql`DROP TABLE \`articles\`;`)
  await db.run(sql`DROP TABLE \`_articles_v\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_page_hero\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_content\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_image_band\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_list_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_list\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_projects\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_journal\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_faq_custom_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_faq\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_cta\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_tenets\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_pricing\`;`)
  await db.run(sql`DROP TABLE \`pages\`;`)
  await db.run(sql`DROP TABLE \`pages_rels\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_page_hero\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_content\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_image_band\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_list_items\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_list\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_projects\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_journal\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_faq_custom_items\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_faq\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_cta\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_tenets\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_pricing\`;`)
  await db.run(sql`DROP TABLE \`_pages_v\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_rels\`;`)
  await db.run(sql`DROP TABLE \`media\`;`)
  await db.run(sql`DROP TABLE \`inquiries\`;`)
  await db.run(sql`DROP TABLE \`users_roles\`;`)
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`redirects\`;`)
  await db.run(sql`DROP TABLE \`redirects_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
  await db.run(sql`DROP TABLE \`home_services_items\`;`)
  await db.run(sql`DROP TABLE \`home_mission_features\`;`)
  await db.run(sql`DROP TABLE \`home_tenets_items\`;`)
  await db.run(sql`DROP TABLE \`home_process_steps\`;`)
  await db.run(sql`DROP TABLE \`home_studio_disciplines\`;`)
  await db.run(sql`DROP TABLE \`home_pricing_tiers_features\`;`)
  await db.run(sql`DROP TABLE \`home_pricing_tiers\`;`)
  await db.run(sql`DROP TABLE \`home_faq_items\`;`)
  await db.run(sql`DROP TABLE \`home\`;`)
  await db.run(sql`DROP TABLE \`home_rels\`;`)
  await db.run(sql`DROP TABLE \`_home_v_version_services_items\`;`)
  await db.run(sql`DROP TABLE \`_home_v_version_mission_features\`;`)
  await db.run(sql`DROP TABLE \`_home_v_version_tenets_items\`;`)
  await db.run(sql`DROP TABLE \`_home_v_version_process_steps\`;`)
  await db.run(sql`DROP TABLE \`_home_v_version_studio_disciplines\`;`)
  await db.run(sql`DROP TABLE \`_home_v_version_pricing_tiers_features\`;`)
  await db.run(sql`DROP TABLE \`_home_v_version_pricing_tiers\`;`)
  await db.run(sql`DROP TABLE \`_home_v_version_faq_items\`;`)
  await db.run(sql`DROP TABLE \`_home_v\`;`)
  await db.run(sql`DROP TABLE \`_home_v_rels\`;`)
  await db.run(sql`DROP TABLE \`about_mosaic\`;`)
  await db.run(sql`DROP TABLE \`about_story_paragraphs\`;`)
  await db.run(sql`DROP TABLE \`about_crafts_cards\`;`)
  await db.run(sql`DROP TABLE \`about\`;`)
  await db.run(sql`DROP TABLE \`_about_v_version_mosaic\`;`)
  await db.run(sql`DROP TABLE \`_about_v_version_story_paragraphs\`;`)
  await db.run(sql`DROP TABLE \`_about_v_version_crafts_cards\`;`)
  await db.run(sql`DROP TABLE \`_about_v\`;`)
  await db.run(sql`DROP TABLE \`services_page_list_items\`;`)
  await db.run(sql`DROP TABLE \`services_page\`;`)
  await db.run(sql`DROP TABLE \`_services_page_v_version_list_items\`;`)
  await db.run(sql`DROP TABLE \`_services_page_v\`;`)
  await db.run(sql`DROP TABLE \`work_page\`;`)
  await db.run(sql`DROP TABLE \`_work_page_v\`;`)
  await db.run(sql`DROP TABLE \`journal_page\`;`)
  await db.run(sql`DROP TABLE \`_journal_page_v\`;`)
  await db.run(sql`DROP TABLE \`contact_page_split_form_budgets\`;`)
  await db.run(sql`DROP TABLE \`contact_page\`;`)
  await db.run(sql`DROP TABLE \`_contact_page_v_version_split_form_budgets\`;`)
  await db.run(sql`DROP TABLE \`_contact_page_v\`;`)
  await db.run(sql`DROP TABLE \`navigation_header_links\`;`)
  await db.run(sql`DROP TABLE \`navigation_footer_columns_links\`;`)
  await db.run(sql`DROP TABLE \`navigation_footer_columns\`;`)
  await db.run(sql`DROP TABLE \`navigation\`;`)
  await db.run(sql`DROP TABLE \`_navigation_v_version_header_links\`;`)
  await db.run(sql`DROP TABLE \`_navigation_v_version_footer_columns_links\`;`)
  await db.run(sql`DROP TABLE \`_navigation_v_version_footer_columns\`;`)
  await db.run(sql`DROP TABLE \`_navigation_v\`;`)
  await db.run(sql`DROP TABLE \`site_stats\`;`)
  await db.run(sql`DROP TABLE \`site_stack\`;`)
  await db.run(sql`DROP TABLE \`site_socials\`;`)
  await db.run(sql`DROP TABLE \`site\`;`)
  await db.run(sql`DROP TABLE \`site_rels\`;`)
  await db.run(sql`DROP TABLE \`_site_v_version_stats\`;`)
  await db.run(sql`DROP TABLE \`_site_v_version_stack\`;`)
  await db.run(sql`DROP TABLE \`_site_v_version_socials\`;`)
  await db.run(sql`DROP TABLE \`_site_v\`;`)
  await db.run(sql`DROP TABLE \`_site_v_rels\`;`)
  await db.run(sql`DROP TABLE \`effects\`;`)
  await db.run(sql`DROP TABLE \`_effects_v\`;`)
  await db.run(sql`DROP TABLE \`not_found\`;`)
  await db.run(sql`DROP TABLE \`_not_found_v\`;`)
  await db.run(sql`DROP TABLE \`privacy_sections_items\`;`)
  await db.run(sql`DROP TABLE \`privacy_sections\`;`)
  await db.run(sql`DROP TABLE \`privacy\`;`)
  await db.run(sql`DROP TABLE \`_privacy_v_version_sections_items\`;`)
  await db.run(sql`DROP TABLE \`_privacy_v_version_sections\`;`)
  await db.run(sql`DROP TABLE \`_privacy_v\`;`)
  await db.run(sql`DROP TABLE \`terms_sections_items\`;`)
  await db.run(sql`DROP TABLE \`terms_sections\`;`)
  await db.run(sql`DROP TABLE \`terms\`;`)
  await db.run(sql`DROP TABLE \`_terms_v_version_sections_items\`;`)
  await db.run(sql`DROP TABLE \`_terms_v_version_sections\`;`)
  await db.run(sql`DROP TABLE \`_terms_v\`;`)
}
