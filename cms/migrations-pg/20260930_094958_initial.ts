import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // The site's own schema, apart from anything else in the database (e.g. the old portfolio's tables).
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS "jomiez_site";`)
  await db.execute(sql`
   CREATE TYPE "jomiez_site"."enum_inquiries_status" AS ENUM('new', 'in-progress', 'replied', 'archived', 'spam');
  CREATE TYPE "jomiez_site"."enum_agent_threads_source" AS ENUM('console', 'page', 'routine', 'inbox');
  CREATE TYPE "jomiez_site"."enum_agent_threads_status" AS ENUM('idle', 'running', 'waiting', 'stopped', 'error');
  CREATE TYPE "jomiez_site"."enum_agent_routines_schedule" AS ENUM('hourly', 'daily', 'weekdays', 'weekly', 'monthly');
  CREATE TYPE "jomiez_site"."enum_agent_routines_weekday" AS ENUM('0', '1', '2', '3', '4', '5', '6');
  CREATE TYPE "jomiez_site"."enum_agent_routines_mode" AS ENUM('inherit', 'ask', 'drafts', 'trusted', 'full');
  CREATE TYPE "jomiez_site"."enum_agent_memory_kind" AS ENUM('fact', 'preference', 'voice', 'lesson', 'contact');
  CREATE TYPE "jomiez_site"."enum_agent_memory_source" AS ENUM('you', 'agent', 'correction');
  CREATE TYPE "jomiez_site"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum_projects_product_page_cards_mock" AS ENUM('research', 'prompt');
  CREATE TYPE "jomiez_site"."enum_projects_product_page_system_features_icon" AS ENUM('arrowRightLight', 'arrowRight', 'trendUpLight', 'rocketLight', 'quotesFill', 'timer', 'xBold', 'check', 'phone', 'whatsapp', 'linkedin', 'github', 'instagram', 'shieldCheck', 'brain', 'gauge', 'plugsConnected', 'magnifyingGlass', 'paperPlaneTilt', 'microphone', 'slidersHorizontal', 'lockSimple', 'arrowClockwise', 'caretLeft', 'caretRight', 'sidebarSimple', 'downloadSimple', 'export', 'plus', 'copy', 'shield', 'name');
  CREATE TYPE "jomiez_site"."enum_projects_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum__projects_v_version_product_page_cards_mock" AS ENUM('research', 'prompt');
  CREATE TYPE "jomiez_site"."enum__projects_v_version_product_page_system_features_icon" AS ENUM('arrowRightLight', 'arrowRight', 'trendUpLight', 'rocketLight', 'quotesFill', 'timer', 'xBold', 'check', 'phone', 'whatsapp', 'linkedin', 'github', 'instagram', 'shieldCheck', 'brain', 'gauge', 'plugsConnected', 'magnifyingGlass', 'paperPlaneTilt', 'microphone', 'slidersHorizontal', 'lockSimple', 'arrowClockwise', 'caretLeft', 'caretRight', 'sidebarSimple', 'downloadSimple', 'export', 'plus', 'copy', 'shield', 'name');
  CREATE TYPE "jomiez_site"."enum__projects_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum_users_roles" AS ENUM('admin', 'editor');
  CREATE TYPE "jomiez_site"."enum_redirects_to_type" AS ENUM('reference', 'custom');
  CREATE TYPE "jomiez_site"."enum_redirects_type" AS ENUM('301', '302');
  CREATE TYPE "jomiez_site"."enum_home_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum__home_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum_about_crafts_cards_shape" AS ENUM('blocks', 'zline', 'rings', 'diamond');
  CREATE TYPE "jomiez_site"."enum_about_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum__about_v_version_crafts_cards_shape" AS ENUM('blocks', 'zline', 'rings', 'diamond');
  CREATE TYPE "jomiez_site"."enum__about_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum_services_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum__services_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum_work_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum__work_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum_journal_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum__journal_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum_contact_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum__contact_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum_navigation_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum__navigation_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum_site_socials_icon" AS ENUM('whatsapp', 'linkedin', 'github', 'instagram');
  CREATE TYPE "jomiez_site"."enum__site_v_version_socials_icon" AS ENUM('whatsapp', 'linkedin', 'github', 'instagram');
  CREATE TYPE "jomiez_site"."enum_not_found_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum__not_found_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum_privacy_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum__privacy_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum_terms_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum__terms_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "jomiez_site"."enum_agent_provider" AS ENUM('anthropic', 'openai', 'google', 'openrouter', 'groq', 'deepseek', 'xai', 'mistral', 'together', 'ollama', 'custom');
  CREATE TYPE "jomiez_site"."enum_agent_thinking" AS ENUM('provider-default', 'none', 'low', 'medium', 'high', 'xhigh');
  CREATE TYPE "jomiez_site"."enum_agent_mode" AS ENUM('ask', 'drafts', 'trusted', 'full');
  CREATE TYPE "jomiez_site"."enum_agent_deletes" AS ENUM('never', 'ask', 'auto');
  CREATE TYPE "jomiez_site"."enum_agent_email" AS ENUM('never', 'ask', 'auto');
  CREATE TABLE "jomiez_site"."inquiries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"company" varchar,
  	"budget" varchar,
  	"message" varchar NOT NULL,
  	"status" "jomiez_site"."enum_inquiries_status" DEFAULT 'new' NOT NULL,
  	"notes" varchar,
  	"source_page" varchar,
  	"source_user_agent" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "jomiez_site"."agent_threads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"owner_id" integer,
  	"source" "jomiez_site"."enum_agent_threads_source" DEFAULT 'console',
  	"status" "jomiez_site"."enum_agent_threads_status" DEFAULT 'idle',
  	"context" jsonb,
  	"messages" jsonb,
  	"events" jsonb,
  	"plan" jsonb,
  	"pending" jsonb,
  	"changes" jsonb,
  	"model" varchar,
  	"usage_input" numeric DEFAULT 0,
  	"usage_output" numeric DEFAULT 0,
  	"routine_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "jomiez_site"."agent_routines" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"instruction" varchar NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"schedule" "jomiez_site"."enum_agent_routines_schedule" DEFAULT 'daily' NOT NULL,
  	"time" varchar DEFAULT '08:00',
  	"weekday" "jomiez_site"."enum_agent_routines_weekday" DEFAULT '1',
  	"timezone" varchar DEFAULT 'Africa/Lagos',
  	"mode" "jomiez_site"."enum_agent_routines_mode" DEFAULT 'inherit',
  	"owner_id" integer,
  	"next_run_at" timestamp(3) with time zone,
  	"last_run_at" timestamp(3) with time zone,
  	"last_status" varchar,
  	"last_thread_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "jomiez_site"."agent_memory" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"content" varchar NOT NULL,
  	"kind" "jomiez_site"."enum_agent_memory_kind" DEFAULT 'fact',
  	"source" "jomiez_site"."enum_agent_memory_source" DEFAULT 'you',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "jomiez_site"."pages_blocks_page_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"lead" varchar,
  	"show_cta" boolean DEFAULT true,
  	"cta_label" varchar,
  	"cta_href" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "jomiez_site"."pages_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "jomiez_site"."pages_blocks_image_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"lead" varchar,
  	"pill" varchar,
  	"title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "jomiez_site"."pages_blocks_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "jomiez_site"."pages_blocks_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "jomiez_site"."pages_blocks_projects" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "jomiez_site"."pages_blocks_journal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Journal',
  	"count" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "jomiez_site"."pages_blocks_faq_custom_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar
  );
  
  CREATE TABLE "jomiez_site"."pages_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"use_site_faq" boolean DEFAULT true,
  	"custom_label" varchar,
  	"custom_sub" varchar,
  	"custom_title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "jomiez_site"."pages_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"cta_label" varchar,
  	"cta_href" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "jomiez_site"."pages_blocks_tenets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "jomiez_site"."pages_blocks_pricing" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "jomiez_site"."pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"placement_menu" boolean DEFAULT false,
  	"placement_footer" boolean DEFAULT false,
  	"placement_column" varchar,
  	"placement_label" varchar,
  	"slug" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "jomiez_site"."enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "jomiez_site"."pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"projects_id" integer
  );
  
  CREATE TABLE "jomiez_site"."_pages_v_blocks_page_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"lead" varchar,
  	"show_cta" boolean DEFAULT true,
  	"cta_label" varchar,
  	"cta_href" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "jomiez_site"."_pages_v_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "jomiez_site"."_pages_v_blocks_image_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"lead" varchar,
  	"pill" varchar,
  	"title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "jomiez_site"."_pages_v_blocks_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_pages_v_blocks_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "jomiez_site"."_pages_v_blocks_projects" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "jomiez_site"."_pages_v_blocks_journal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Journal',
  	"count" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "jomiez_site"."_pages_v_blocks_faq_custom_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_pages_v_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"use_site_faq" boolean DEFAULT true,
  	"custom_label" varchar,
  	"custom_sub" varchar,
  	"custom_title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "jomiez_site"."_pages_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"cta_label" varchar,
  	"cta_href" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "jomiez_site"."_pages_v_blocks_tenets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "jomiez_site"."_pages_v_blocks_pricing" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "jomiez_site"."_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_placement_menu" boolean DEFAULT false,
  	"version_placement_footer" boolean DEFAULT false,
  	"version_placement_column" varchar,
  	"version_placement_label" varchar,
  	"version_slug" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "jomiez_site"."enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "jomiez_site"."_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"projects_id" integer
  );
  
  CREATE TABLE "jomiez_site"."projects_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "jomiez_site"."projects_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "jomiez_site"."projects_sections_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "jomiez_site"."projects_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "jomiez_site"."projects_product_page_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "jomiez_site"."projects_product_page_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"mock" "jomiez_site"."enum_projects_product_page_cards_mock" DEFAULT 'research',
  	"mock_title" varchar,
  	"art_id" integer
  );
  
  CREATE TABLE "jomiez_site"."projects_product_page_system_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "jomiez_site"."enum_projects_product_page_system_features_icon" DEFAULT 'shieldCheck',
  	"text" varchar
  );
  
  CREATE TABLE "jomiez_site"."projects_product_page_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar
  );
  
  CREATE TABLE "jomiez_site"."projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"name" varchar,
  	"category" varchar,
  	"is_product" boolean DEFAULT false,
  	"summary" varchar,
  	"image_id" integer,
  	"client" varchar,
  	"year" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"product_page_hero_title" varchar,
  	"product_page_hero_lead" varchar,
  	"product_page_hero_cta_label" varchar,
  	"product_page_hero_cta_href" varchar,
  	"product_page_hero_image_id" integer,
  	"product_page_hero_proof" varchar,
  	"product_page_showcase_title" varchar,
  	"product_page_showcase_lead" varchar,
  	"product_page_showcase_background_id" integer,
  	"product_page_showcase_screen_id" integer,
  	"product_page_showcase_address" varchar,
  	"product_page_statement" varchar,
  	"product_page_system_label" varchar,
  	"product_page_system_text" varchar,
  	"product_page_faq_sub" varchar,
  	"product_page_faq_title" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "jomiez_site"."enum_projects_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "jomiez_site"."_projects_v_version_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_projects_v_version_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_projects_v_version_sections_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_projects_v_version_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_projects_v_version_product_page_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_projects_v_version_product_page_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"mock" "jomiez_site"."enum__projects_v_version_product_page_cards_mock" DEFAULT 'research',
  	"mock_title" varchar,
  	"art_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_projects_v_version_product_page_system_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "jomiez_site"."enum__projects_v_version_product_page_system_features_icon" DEFAULT 'shieldCheck',
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_projects_v_version_product_page_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_projects_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version__order" varchar,
  	"version_name" varchar,
  	"version_category" varchar,
  	"version_is_product" boolean DEFAULT false,
  	"version_summary" varchar,
  	"version_image_id" integer,
  	"version_client" varchar,
  	"version_year" varchar,
  	"version_link_label" varchar,
  	"version_link_href" varchar,
  	"version_product_page_hero_title" varchar,
  	"version_product_page_hero_lead" varchar,
  	"version_product_page_hero_cta_label" varchar,
  	"version_product_page_hero_cta_href" varchar,
  	"version_product_page_hero_image_id" integer,
  	"version_product_page_hero_proof" varchar,
  	"version_product_page_showcase_title" varchar,
  	"version_product_page_showcase_lead" varchar,
  	"version_product_page_showcase_background_id" integer,
  	"version_product_page_showcase_screen_id" integer,
  	"version_product_page_showcase_address" varchar,
  	"version_product_page_statement" varchar,
  	"version_product_page_system_label" varchar,
  	"version_product_page_system_text" varchar,
  	"version_product_page_faq_sub" varchar,
  	"version_product_page_faq_title" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "jomiez_site"."enum__projects_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "jomiez_site"."articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"excerpt" varchar,
  	"image_id" integer,
  	"body" jsonb,
  	"slug" varchar,
  	"category" varchar,
  	"author" varchar DEFAULT 'Jomiez Team',
  	"date" timestamp(3) with time zone,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "jomiez_site"."enum_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "jomiez_site"."_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_excerpt" varchar,
  	"version_image_id" integer,
  	"version_body" jsonb,
  	"version_slug" varchar,
  	"version_category" varchar,
  	"version_author" varchar DEFAULT 'Jomiez Team',
  	"version_date" timestamp(3) with time zone,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "jomiez_site"."enum__articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "jomiez_site"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar
  );
  
  CREATE TABLE "jomiez_site"."users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "jomiez_site"."enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "jomiez_site"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "jomiez_site"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "jomiez_site"."redirects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL,
  	"to_type" "jomiez_site"."enum_redirects_to_type" DEFAULT 'reference',
  	"to_url" varchar,
  	"type" "jomiez_site"."enum_redirects_type" NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "jomiez_site"."redirects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"projects_id" integer,
  	"articles_id" integer
  );
  
  CREATE TABLE "jomiez_site"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "jomiez_site"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "jomiez_site"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"inquiries_id" integer,
  	"agent_threads_id" integer,
  	"agent_routines_id" integer,
  	"agent_memory_id" integer,
  	"pages_id" integer,
  	"projects_id" integer,
  	"articles_id" integer,
  	"media_id" integer,
  	"users_id" integer,
  	"redirects_id" integer
  );
  
  CREATE TABLE "jomiez_site"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "jomiez_site"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "jomiez_site"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "jomiez_site"."home_services_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "jomiez_site"."home_mission_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "jomiez_site"."home_tenets_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"tag" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "jomiez_site"."home_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"tag" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "jomiez_site"."home_studio_disciplines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"body" varchar,
  	"image_id" integer,
  	"href" varchar
  );
  
  CREATE TABLE "jomiez_site"."home_pricing_tiers_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "jomiez_site"."home_pricing_tiers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"price" varchar DEFAULT 'Custom',
  	"dark" boolean,
  	"blurb" varchar,
  	"cta_label" varchar,
  	"cta_href" varchar
  );
  
  CREATE TABLE "jomiez_site"."home_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar
  );
  
  CREATE TABLE "jomiez_site"."home" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_enabled" boolean DEFAULT true,
  	"hero_title_muted" varchar,
  	"hero_title_main" varchar,
  	"hero_lead" varchar,
  	"hero_cta_label" varchar,
  	"hero_cta_href" varchar,
  	"hero_background_id" integer,
  	"hero_card_enabled" boolean DEFAULT true,
  	"hero_card_title" varchar,
  	"hero_card_subtitle" varchar,
  	"hero_card_href" varchar,
  	"hero_card_image_id" integer,
  	"hero_card_frame_id" integer,
  	"hero_note" varchar,
  	"hero_show_stack" boolean DEFAULT true,
  	"intro_enabled" boolean DEFAULT true,
  	"intro_statement" varchar,
  	"intro_sub" varchar,
  	"intro_projects_value" varchar,
  	"intro_projects_text" varchar,
  	"intro_satisfaction_value" varchar,
  	"intro_satisfaction_label" varchar,
  	"intro_years_value" varchar,
  	"intro_years_text" varchar,
  	"intro_speed_title" varchar,
  	"intro_speed_text" varchar,
  	"intro_quote_text" varchar,
  	"intro_quote_brand" varchar,
  	"intro_quote_by" varchar,
  	"intro_show_ticker" boolean DEFAULT true,
  	"work_enabled" boolean DEFAULT true,
  	"work_marquee" varchar,
  	"services_enabled" boolean DEFAULT true,
  	"services_label" varchar,
  	"services_intro" varchar,
  	"services_title" varchar,
  	"services_cta_label" varchar,
  	"services_cta_href" varchar,
  	"services_texture_id" integer,
  	"services_iso_id" integer,
  	"mission_enabled" boolean DEFAULT true,
  	"mission_label" varchar,
  	"mission_statement" varchar,
  	"mission_body" varchar,
  	"mission_models_intro" varchar,
  	"mission_cta_label" varchar,
  	"mission_cta_href" varchar,
  	"tenets_enabled" boolean DEFAULT true,
  	"tenets_marquee" varchar,
  	"tenets_description" varchar,
  	"tenets_card_footer" varchar,
  	"tenets_show_ticker" boolean DEFAULT true,
  	"showcase_enabled" boolean DEFAULT true,
  	"showcase_image_id" integer,
  	"showcase_lead" varchar,
  	"showcase_pill" varchar,
  	"showcase_title" varchar,
  	"process_enabled" boolean DEFAULT true,
  	"process_label" varchar,
  	"process_title" varchar,
  	"process_texture_id" integer,
  	"process_iso_id" integer,
  	"process_closing" varchar,
  	"process_cta_label" varchar,
  	"process_cta_href" varchar,
  	"studio_enabled" boolean DEFAULT true,
  	"studio_statement" varchar,
  	"studio_intro" varchar,
  	"studio_cta_label" varchar,
  	"studio_cta_href" varchar,
  	"studio_explore_label" varchar,
  	"pricing_enabled" boolean DEFAULT true,
  	"pricing_marquee" varchar,
  	"pricing_intro" varchar,
  	"pricing_billing_left" varchar,
  	"pricing_billing_right" varchar,
  	"pricing_billing_hint" varchar,
  	"pricing_billing_left_note" varchar,
  	"pricing_billing_right_note" varchar,
  	"pricing_card_image_id" integer,
  	"pricing_show_ticker" boolean DEFAULT true,
  	"faq_enabled" boolean DEFAULT true,
  	"faq_label" varchar,
  	"faq_sub" varchar,
  	"faq_title" varchar,
  	"faq_cta_label" varchar,
  	"faq_cta_href" varchar,
  	"journal_enabled" boolean DEFAULT true,
  	"journal_marquee" varchar,
  	"journal_intro" varchar,
  	"journal_cta_label" varchar,
  	"journal_cta_href" varchar,
  	"journal_count" numeric DEFAULT 3,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"_status" "jomiez_site"."enum_home_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "jomiez_site"."home_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"projects_id" integer
  );
  
  CREATE TABLE "jomiez_site"."_home_v_version_services_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_home_v_version_mission_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_home_v_version_tenets_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"tag" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_home_v_version_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"tag" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_home_v_version_studio_disciplines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"body" varchar,
  	"image_id" integer,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_home_v_version_pricing_tiers_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_home_v_version_pricing_tiers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"price" varchar DEFAULT 'Custom',
  	"dark" boolean,
  	"blurb" varchar,
  	"cta_label" varchar,
  	"cta_href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_home_v_version_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_home_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_enabled" boolean DEFAULT true,
  	"version_hero_title_muted" varchar,
  	"version_hero_title_main" varchar,
  	"version_hero_lead" varchar,
  	"version_hero_cta_label" varchar,
  	"version_hero_cta_href" varchar,
  	"version_hero_background_id" integer,
  	"version_hero_card_enabled" boolean DEFAULT true,
  	"version_hero_card_title" varchar,
  	"version_hero_card_subtitle" varchar,
  	"version_hero_card_href" varchar,
  	"version_hero_card_image_id" integer,
  	"version_hero_card_frame_id" integer,
  	"version_hero_note" varchar,
  	"version_hero_show_stack" boolean DEFAULT true,
  	"version_intro_enabled" boolean DEFAULT true,
  	"version_intro_statement" varchar,
  	"version_intro_sub" varchar,
  	"version_intro_projects_value" varchar,
  	"version_intro_projects_text" varchar,
  	"version_intro_satisfaction_value" varchar,
  	"version_intro_satisfaction_label" varchar,
  	"version_intro_years_value" varchar,
  	"version_intro_years_text" varchar,
  	"version_intro_speed_title" varchar,
  	"version_intro_speed_text" varchar,
  	"version_intro_quote_text" varchar,
  	"version_intro_quote_brand" varchar,
  	"version_intro_quote_by" varchar,
  	"version_intro_show_ticker" boolean DEFAULT true,
  	"version_work_enabled" boolean DEFAULT true,
  	"version_work_marquee" varchar,
  	"version_services_enabled" boolean DEFAULT true,
  	"version_services_label" varchar,
  	"version_services_intro" varchar,
  	"version_services_title" varchar,
  	"version_services_cta_label" varchar,
  	"version_services_cta_href" varchar,
  	"version_services_texture_id" integer,
  	"version_services_iso_id" integer,
  	"version_mission_enabled" boolean DEFAULT true,
  	"version_mission_label" varchar,
  	"version_mission_statement" varchar,
  	"version_mission_body" varchar,
  	"version_mission_models_intro" varchar,
  	"version_mission_cta_label" varchar,
  	"version_mission_cta_href" varchar,
  	"version_tenets_enabled" boolean DEFAULT true,
  	"version_tenets_marquee" varchar,
  	"version_tenets_description" varchar,
  	"version_tenets_card_footer" varchar,
  	"version_tenets_show_ticker" boolean DEFAULT true,
  	"version_showcase_enabled" boolean DEFAULT true,
  	"version_showcase_image_id" integer,
  	"version_showcase_lead" varchar,
  	"version_showcase_pill" varchar,
  	"version_showcase_title" varchar,
  	"version_process_enabled" boolean DEFAULT true,
  	"version_process_label" varchar,
  	"version_process_title" varchar,
  	"version_process_texture_id" integer,
  	"version_process_iso_id" integer,
  	"version_process_closing" varchar,
  	"version_process_cta_label" varchar,
  	"version_process_cta_href" varchar,
  	"version_studio_enabled" boolean DEFAULT true,
  	"version_studio_statement" varchar,
  	"version_studio_intro" varchar,
  	"version_studio_cta_label" varchar,
  	"version_studio_cta_href" varchar,
  	"version_studio_explore_label" varchar,
  	"version_pricing_enabled" boolean DEFAULT true,
  	"version_pricing_marquee" varchar,
  	"version_pricing_intro" varchar,
  	"version_pricing_billing_left" varchar,
  	"version_pricing_billing_right" varchar,
  	"version_pricing_billing_hint" varchar,
  	"version_pricing_billing_left_note" varchar,
  	"version_pricing_billing_right_note" varchar,
  	"version_pricing_card_image_id" integer,
  	"version_pricing_show_ticker" boolean DEFAULT true,
  	"version_faq_enabled" boolean DEFAULT true,
  	"version_faq_label" varchar,
  	"version_faq_sub" varchar,
  	"version_faq_title" varchar,
  	"version_faq_cta_label" varchar,
  	"version_faq_cta_href" varchar,
  	"version_journal_enabled" boolean DEFAULT true,
  	"version_journal_marquee" varchar,
  	"version_journal_intro" varchar,
  	"version_journal_cta_label" varchar,
  	"version_journal_cta_href" varchar,
  	"version_journal_count" numeric DEFAULT 3,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version__status" "jomiez_site"."enum__home_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "jomiez_site"."_home_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"projects_id" integer
  );
  
  CREATE TABLE "jomiez_site"."about_mosaic" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "jomiez_site"."about_story_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "jomiez_site"."about_crafts_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"shape" "jomiez_site"."enum_about_crafts_cards_shape" DEFAULT 'blocks'
  );
  
  CREATE TABLE "jomiez_site"."about" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_title" varchar,
  	"hero_lead" varchar,
  	"hero_cta_label" varchar,
  	"hero_cta_href" varchar,
  	"story_enabled" boolean DEFAULT true,
  	"story_label" varchar,
  	"story_title" varchar,
  	"story_cta_label" varchar,
  	"story_cta_href" varchar,
  	"story_show_stats" boolean DEFAULT true,
  	"crafts_enabled" boolean DEFAULT true,
  	"crafts_label" varchar,
  	"crafts_statement" varchar,
  	"crafts_lead" varchar,
  	"crafts_show_stack" boolean DEFAULT true,
  	"show_tenets" boolean DEFAULT true,
  	"show_faq" boolean DEFAULT true,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"_status" "jomiez_site"."enum_about_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "jomiez_site"."_about_v_version_mosaic" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_about_v_version_story_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_about_v_version_crafts_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"shape" "jomiez_site"."enum__about_v_version_crafts_cards_shape" DEFAULT 'blocks',
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_about_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_title" varchar,
  	"version_hero_lead" varchar,
  	"version_hero_cta_label" varchar,
  	"version_hero_cta_href" varchar,
  	"version_story_enabled" boolean DEFAULT true,
  	"version_story_label" varchar,
  	"version_story_title" varchar,
  	"version_story_cta_label" varchar,
  	"version_story_cta_href" varchar,
  	"version_story_show_stats" boolean DEFAULT true,
  	"version_crafts_enabled" boolean DEFAULT true,
  	"version_crafts_label" varchar,
  	"version_crafts_statement" varchar,
  	"version_crafts_lead" varchar,
  	"version_crafts_show_stack" boolean DEFAULT true,
  	"version_show_tenets" boolean DEFAULT true,
  	"version_show_faq" boolean DEFAULT true,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version__status" "jomiez_site"."enum__about_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "jomiez_site"."services_page_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "jomiez_site"."services_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_eyebrow" varchar,
  	"hero_title" varchar,
  	"hero_lead" varchar,
  	"hero_cta_label" varchar,
  	"hero_cta_href" varchar,
  	"show_accordion" boolean DEFAULT true,
  	"show_process" boolean DEFAULT true,
  	"list_enabled" boolean DEFAULT true,
  	"list_title" varchar,
  	"show_faq" boolean DEFAULT true,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"_status" "jomiez_site"."enum_services_page_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "jomiez_site"."_services_page_v_version_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_services_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_eyebrow" varchar,
  	"version_hero_title" varchar,
  	"version_hero_lead" varchar,
  	"version_hero_cta_label" varchar,
  	"version_hero_cta_href" varchar,
  	"version_show_accordion" boolean DEFAULT true,
  	"version_show_process" boolean DEFAULT true,
  	"version_list_enabled" boolean DEFAULT true,
  	"version_list_title" varchar,
  	"version_show_faq" boolean DEFAULT true,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version__status" "jomiez_site"."enum__services_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "jomiez_site"."work_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"marquee" varchar,
  	"note" varchar,
  	"products_label" varchar,
  	"clients_label" varchar,
  	"case_study_product_kicker" varchar,
  	"case_study_case_kicker" varchar,
  	"case_study_next_product" varchar,
  	"case_study_next_case" varchar,
  	"case_study_cta_title" varchar,
  	"case_study_cta_label" varchar,
  	"case_study_cta_href" varchar,
  	"show_faq" boolean DEFAULT true,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"_status" "jomiez_site"."enum_work_page_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "jomiez_site"."_work_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_image_id" integer,
  	"version_marquee" varchar,
  	"version_note" varchar,
  	"version_products_label" varchar,
  	"version_clients_label" varchar,
  	"version_case_study_product_kicker" varchar,
  	"version_case_study_case_kicker" varchar,
  	"version_case_study_next_product" varchar,
  	"version_case_study_next_case" varchar,
  	"version_case_study_cta_title" varchar,
  	"version_case_study_cta_label" varchar,
  	"version_case_study_cta_href" varchar,
  	"version_show_faq" boolean DEFAULT true,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version__status" "jomiez_site"."enum__work_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "jomiez_site"."journal_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"marquee" varchar,
  	"intro" varchar,
  	"post_author_label" varchar,
  	"post_date_label" varchar,
  	"post_by_label" varchar,
  	"post_more_title" varchar,
  	"post_cta_label" varchar,
  	"post_cta_href" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"_status" "jomiez_site"."enum_journal_page_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "jomiez_site"."_journal_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_marquee" varchar,
  	"version_intro" varchar,
  	"version_post_author_label" varchar,
  	"version_post_date_label" varchar,
  	"version_post_by_label" varchar,
  	"version_post_more_title" varchar,
  	"version_post_cta_label" varchar,
  	"version_post_cta_href" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version__status" "jomiez_site"."enum__journal_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "jomiez_site"."contact_page_split_form_budgets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "jomiez_site"."contact_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"split_title" varchar,
  	"split_lead" varchar,
  	"split_image_id" integer,
  	"split_visual_title" varchar,
  	"split_form_name_label" varchar,
  	"split_form_name_placeholder" varchar,
  	"split_form_email_label" varchar,
  	"split_form_email_placeholder" varchar,
  	"split_form_budget_label" varchar,
  	"split_form_message_label" varchar,
  	"split_form_message_placeholder" varchar,
  	"split_form_submit_label" varchar,
  	"split_form_success_message" varchar,
  	"split_form_error_message" varchar,
  	"call_enabled" boolean DEFAULT true,
  	"call_image_id" integer,
  	"call_label" varchar,
  	"call_title" varchar,
  	"call_body" varchar,
  	"call_show_socials" boolean DEFAULT true,
  	"call_cta_label" varchar,
  	"call_cta_href" varchar,
  	"show_faq" boolean DEFAULT true,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"_status" "jomiez_site"."enum_contact_page_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "jomiez_site"."_contact_page_v_version_split_form_budgets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_contact_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_split_title" varchar,
  	"version_split_lead" varchar,
  	"version_split_image_id" integer,
  	"version_split_visual_title" varchar,
  	"version_split_form_name_label" varchar,
  	"version_split_form_name_placeholder" varchar,
  	"version_split_form_email_label" varchar,
  	"version_split_form_email_placeholder" varchar,
  	"version_split_form_budget_label" varchar,
  	"version_split_form_message_label" varchar,
  	"version_split_form_message_placeholder" varchar,
  	"version_split_form_submit_label" varchar,
  	"version_split_form_success_message" varchar,
  	"version_split_form_error_message" varchar,
  	"version_call_enabled" boolean DEFAULT true,
  	"version_call_image_id" integer,
  	"version_call_label" varchar,
  	"version_call_title" varchar,
  	"version_call_body" varchar,
  	"version_call_show_socials" boolean DEFAULT true,
  	"version_call_cta_label" varchar,
  	"version_call_cta_href" varchar,
  	"version_show_faq" boolean DEFAULT true,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version__status" "jomiez_site"."enum__contact_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "jomiez_site"."navigation_header_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "jomiez_site"."navigation_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "jomiez_site"."navigation_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar
  );
  
  CREATE TABLE "jomiez_site"."navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"header_show_hire" boolean DEFAULT true,
  	"header_hire_label" varchar,
  	"header_hire_href" varchar,
  	"footer_background_id" integer,
  	"footer_blurb" varchar,
  	"footer_cta_label" varchar,
  	"footer_cta_href" varchar,
  	"footer_follow_label" varchar,
  	"footer_copyright" varchar,
  	"footer_show_wordmark" boolean DEFAULT true,
  	"_status" "jomiez_site"."enum_navigation_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "jomiez_site"."_navigation_v_version_header_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_navigation_v_version_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_navigation_v_version_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_navigation_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_header_show_hire" boolean DEFAULT true,
  	"version_header_hire_label" varchar,
  	"version_header_hire_href" varchar,
  	"version_footer_background_id" integer,
  	"version_footer_blurb" varchar,
  	"version_footer_cta_label" varchar,
  	"version_footer_cta_href" varchar,
  	"version_footer_follow_label" varchar,
  	"version_footer_copyright" varchar,
  	"version_footer_show_wordmark" boolean DEFAULT true,
  	"version__status" "jomiez_site"."enum__navigation_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "jomiez_site"."site_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "jomiez_site"."site_stack" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "jomiez_site"."site_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"icon" "jomiez_site"."enum_site_socials_icon" NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "jomiez_site"."site" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"legal_name" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"founder_name" varchar,
  	"founder_alias" varchar,
  	"founder_role" varchar,
  	"founder_photo_id" integer,
  	"founder_monogram" varchar,
  	"email" varchar NOT NULL,
  	"location" varchar,
  	"phone" varchar,
  	"phone_href" varchar,
  	"ticker_enabled" boolean DEFAULT true,
  	"ticker_tag" varchar,
  	"ticker_message" varchar,
  	"title" varchar NOT NULL,
  	"title_template" varchar DEFAULT '%s | Jomiez' NOT NULL,
  	"description" varchar NOT NULL,
  	"og_image_id" integer,
  	"notifications_to" varchar,
  	"notifications_auto_reply" boolean DEFAULT true,
  	"notifications_auto_reply_subject" varchar,
  	"notifications_auto_reply_body" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "jomiez_site"."site_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "jomiez_site"."_site_v_version_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_site_v_version_stack" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_site_v_version_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"icon" "jomiez_site"."enum__site_v_version_socials_icon" NOT NULL,
  	"href" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_site_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_name" varchar NOT NULL,
  	"version_legal_name" varchar NOT NULL,
  	"version_url" varchar NOT NULL,
  	"version_founder_name" varchar,
  	"version_founder_alias" varchar,
  	"version_founder_role" varchar,
  	"version_founder_photo_id" integer,
  	"version_founder_monogram" varchar,
  	"version_email" varchar NOT NULL,
  	"version_location" varchar,
  	"version_phone" varchar,
  	"version_phone_href" varchar,
  	"version_ticker_enabled" boolean DEFAULT true,
  	"version_ticker_tag" varchar,
  	"version_ticker_message" varchar,
  	"version_title" varchar NOT NULL,
  	"version_title_template" varchar DEFAULT '%s | Jomiez' NOT NULL,
  	"version_description" varchar NOT NULL,
  	"version_og_image_id" integer,
  	"version_notifications_to" varchar,
  	"version_notifications_auto_reply" boolean DEFAULT true,
  	"version_notifications_auto_reply_subject" varchar,
  	"version_notifications_auto_reply_body" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "jomiez_site"."_site_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "jomiez_site"."effects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"cursor_lens" boolean DEFAULT true,
  	"lens_size" numeric DEFAULT 132,
  	"nav_glass" boolean DEFAULT true,
  	"footer_glass" boolean DEFAULT true,
  	"hero_dew" boolean DEFAULT true,
  	"page_transitions" boolean DEFAULT true,
  	"smooth_scroll" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "jomiez_site"."_effects_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_cursor_lens" boolean DEFAULT true,
  	"version_lens_size" numeric DEFAULT 132,
  	"version_nav_glass" boolean DEFAULT true,
  	"version_footer_glass" boolean DEFAULT true,
  	"version_hero_dew" boolean DEFAULT true,
  	"version_page_transitions" boolean DEFAULT true,
  	"version_smooth_scroll" boolean DEFAULT true,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "jomiez_site"."not_found" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"cta_label" varchar,
  	"cta_href" varchar,
  	"_status" "jomiez_site"."enum_not_found_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "jomiez_site"."_not_found_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_title" varchar,
  	"version_body" varchar,
  	"version_cta_label" varchar,
  	"version_cta_href" varchar,
  	"version__status" "jomiez_site"."enum__not_found_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "jomiez_site"."privacy_sections_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "jomiez_site"."privacy_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"intro" varchar
  );
  
  CREATE TABLE "jomiez_site"."privacy" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"intro" varchar,
  	"contact_note" boolean DEFAULT true,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"_status" "jomiez_site"."enum_privacy_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "jomiez_site"."_privacy_v_version_sections_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_privacy_v_version_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"intro" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_privacy_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_title" varchar,
  	"version_intro" varchar,
  	"version_contact_note" boolean DEFAULT true,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version__status" "jomiez_site"."enum__privacy_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "jomiez_site"."terms_sections_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "jomiez_site"."terms_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"intro" varchar
  );
  
  CREATE TABLE "jomiez_site"."terms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"intro" varchar,
  	"contact_note" boolean DEFAULT true,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"_status" "jomiez_site"."enum_terms_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "jomiez_site"."_terms_v_version_sections_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_terms_v_version_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"intro" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "jomiez_site"."_terms_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_title" varchar,
  	"version_intro" varchar,
  	"version_contact_note" boolean DEFAULT true,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version__status" "jomiez_site"."enum__terms_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "jomiez_site"."agent" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"name" varchar DEFAULT 'Keeper' NOT NULL,
  	"provider" "jomiez_site"."enum_agent_provider" DEFAULT 'anthropic' NOT NULL,
  	"model" varchar DEFAULT 'claude-opus-5-5' NOT NULL,
  	"api_key" varchar,
  	"api_key_hint" varchar,
  	"base_u_r_l" varchar,
  	"fast_model" varchar DEFAULT 'claude-haiku-4-5-20251001',
  	"thinking" "jomiez_site"."enum_agent_thinking" DEFAULT 'provider-default',
  	"mode" "jomiez_site"."enum_agent_mode" DEFAULT 'drafts',
  	"deletes" "jomiez_site"."enum_agent_deletes" DEFAULT 'ask',
  	"email" "jomiez_site"."enum_agent_email" DEFAULT 'ask',
  	"web" boolean DEFAULT true,
  	"persona" varchar DEFAULT 'Write like jomiez.com: an ancient, natural voice (roots, seasons, gardens, craft), calm and certain, never hype. Short sentences. Plain words. No exclamation marks.
  Jomiez Innovation is a software company that grows its own AI products (Chaka AI, Chaka WAP) and builds custom software for businesses.
  Never invent facts, numbers, clients or testimonials. If something isn''t known, ask or leave it out.',
  	"triage" boolean DEFAULT true,
  	"triage_draft" boolean DEFAULT true,
  	"notify_auto" boolean DEFAULT true,
  	"notify_email" varchar,
  	"max_steps" numeric DEFAULT 40,
  	"daily_runs" numeric DEFAULT 300,
  	"daily_tokens" numeric DEFAULT 5000000,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "jomiez_site"."agent_threads" ADD CONSTRAINT "agent_threads_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "jomiez_site"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."agent_threads" ADD CONSTRAINT "agent_threads_routine_id_agent_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "jomiez_site"."agent_routines"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."agent_routines" ADD CONSTRAINT "agent_routines_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "jomiez_site"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."agent_routines" ADD CONSTRAINT "agent_routines_last_thread_id_agent_threads_id_fk" FOREIGN KEY ("last_thread_id") REFERENCES "jomiez_site"."agent_threads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."pages_blocks_page_hero" ADD CONSTRAINT "pages_blocks_page_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."pages_blocks_content" ADD CONSTRAINT "pages_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."pages_blocks_image_band" ADD CONSTRAINT "pages_blocks_image_band_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."pages_blocks_image_band" ADD CONSTRAINT "pages_blocks_image_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."pages_blocks_list_items" ADD CONSTRAINT "pages_blocks_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."pages_blocks_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."pages_blocks_list" ADD CONSTRAINT "pages_blocks_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."pages_blocks_projects" ADD CONSTRAINT "pages_blocks_projects_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."pages_blocks_journal" ADD CONSTRAINT "pages_blocks_journal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."pages_blocks_faq_custom_items" ADD CONSTRAINT "pages_blocks_faq_custom_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."pages_blocks_faq" ADD CONSTRAINT "pages_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."pages_blocks_tenets" ADD CONSTRAINT "pages_blocks_tenets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."pages_blocks_pricing" ADD CONSTRAINT "pages_blocks_pricing_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."pages" ADD CONSTRAINT "pages_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "jomiez_site"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."pages_rels" ADD CONSTRAINT "pages_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "jomiez_site"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_pages_v_blocks_page_hero" ADD CONSTRAINT "_pages_v_blocks_page_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_pages_v_blocks_content" ADD CONSTRAINT "_pages_v_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_pages_v_blocks_image_band" ADD CONSTRAINT "_pages_v_blocks_image_band_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_pages_v_blocks_image_band" ADD CONSTRAINT "_pages_v_blocks_image_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_pages_v_blocks_list_items" ADD CONSTRAINT "_pages_v_blocks_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_pages_v_blocks_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_pages_v_blocks_list" ADD CONSTRAINT "_pages_v_blocks_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_pages_v_blocks_projects" ADD CONSTRAINT "_pages_v_blocks_projects_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_pages_v_blocks_journal" ADD CONSTRAINT "_pages_v_blocks_journal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_pages_v_blocks_faq_custom_items" ADD CONSTRAINT "_pages_v_blocks_faq_custom_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_pages_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_pages_v_blocks_faq" ADD CONSTRAINT "_pages_v_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_pages_v_blocks_tenets" ADD CONSTRAINT "_pages_v_blocks_tenets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_pages_v_blocks_pricing" ADD CONSTRAINT "_pages_v_blocks_pricing_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "jomiez_site"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_pages_v" ADD CONSTRAINT "_pages_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "jomiez_site"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "jomiez_site"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."projects_services" ADD CONSTRAINT "projects_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."projects_stats" ADD CONSTRAINT "projects_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."projects_sections_points" ADD CONSTRAINT "projects_sections_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."projects_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."projects_sections" ADD CONSTRAINT "projects_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."projects_product_page_stats" ADD CONSTRAINT "projects_product_page_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."projects_product_page_cards" ADD CONSTRAINT "projects_product_page_cards_art_id_media_id_fk" FOREIGN KEY ("art_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."projects_product_page_cards" ADD CONSTRAINT "projects_product_page_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."projects_product_page_system_features" ADD CONSTRAINT "projects_product_page_system_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."projects_product_page_faq_items" ADD CONSTRAINT "projects_product_page_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."projects" ADD CONSTRAINT "projects_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."projects" ADD CONSTRAINT "projects_product_page_hero_image_id_media_id_fk" FOREIGN KEY ("product_page_hero_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."projects" ADD CONSTRAINT "projects_product_page_showcase_background_id_media_id_fk" FOREIGN KEY ("product_page_showcase_background_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."projects" ADD CONSTRAINT "projects_product_page_showcase_screen_id_media_id_fk" FOREIGN KEY ("product_page_showcase_screen_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."projects" ADD CONSTRAINT "projects_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_projects_v_version_services" ADD CONSTRAINT "_projects_v_version_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_projects_v_version_stats" ADD CONSTRAINT "_projects_v_version_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_projects_v_version_sections_points" ADD CONSTRAINT "_projects_v_version_sections_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_projects_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_projects_v_version_sections" ADD CONSTRAINT "_projects_v_version_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_projects_v_version_product_page_stats" ADD CONSTRAINT "_projects_v_version_product_page_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_projects_v_version_product_page_cards" ADD CONSTRAINT "_projects_v_version_product_page_cards_art_id_media_id_fk" FOREIGN KEY ("art_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_projects_v_version_product_page_cards" ADD CONSTRAINT "_projects_v_version_product_page_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_projects_v_version_product_page_system_features" ADD CONSTRAINT "_projects_v_version_product_page_system_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_projects_v_version_product_page_faq_items" ADD CONSTRAINT "_projects_v_version_product_page_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_projects_v" ADD CONSTRAINT "_projects_v_parent_id_projects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "jomiez_site"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_projects_v" ADD CONSTRAINT "_projects_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_projects_v" ADD CONSTRAINT "_projects_v_version_product_page_hero_image_id_media_id_fk" FOREIGN KEY ("version_product_page_hero_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_projects_v" ADD CONSTRAINT "_projects_v_version_product_page_showcase_background_id_media_id_fk" FOREIGN KEY ("version_product_page_showcase_background_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_projects_v" ADD CONSTRAINT "_projects_v_version_product_page_showcase_screen_id_media_id_fk" FOREIGN KEY ("version_product_page_showcase_screen_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_projects_v" ADD CONSTRAINT "_projects_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."articles" ADD CONSTRAINT "articles_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."articles" ADD CONSTRAINT "articles_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "jomiez_site"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_articles_v" ADD CONSTRAINT "_articles_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_articles_v" ADD CONSTRAINT "_articles_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "jomiez_site"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."redirects_rels" ADD CONSTRAINT "redirects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "jomiez_site"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."redirects_rels" ADD CONSTRAINT "redirects_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "jomiez_site"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."redirects_rels" ADD CONSTRAINT "redirects_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "jomiez_site"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."redirects_rels" ADD CONSTRAINT "redirects_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "jomiez_site"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "jomiez_site"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inquiries_fk" FOREIGN KEY ("inquiries_id") REFERENCES "jomiez_site"."inquiries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_agent_threads_fk" FOREIGN KEY ("agent_threads_id") REFERENCES "jomiez_site"."agent_threads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_agent_routines_fk" FOREIGN KEY ("agent_routines_id") REFERENCES "jomiez_site"."agent_routines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_agent_memory_fk" FOREIGN KEY ("agent_memory_id") REFERENCES "jomiez_site"."agent_memory"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "jomiez_site"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "jomiez_site"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "jomiez_site"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "jomiez_site"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "jomiez_site"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "jomiez_site"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "jomiez_site"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "jomiez_site"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."home_services_items" ADD CONSTRAINT "home_services_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."home_mission_features" ADD CONSTRAINT "home_mission_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."home_tenets_items" ADD CONSTRAINT "home_tenets_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."home_process_steps" ADD CONSTRAINT "home_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."home_studio_disciplines" ADD CONSTRAINT "home_studio_disciplines_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."home_studio_disciplines" ADD CONSTRAINT "home_studio_disciplines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."home_pricing_tiers_features" ADD CONSTRAINT "home_pricing_tiers_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."home_pricing_tiers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."home_pricing_tiers" ADD CONSTRAINT "home_pricing_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."home_faq_items" ADD CONSTRAINT "home_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."home" ADD CONSTRAINT "home_hero_background_id_media_id_fk" FOREIGN KEY ("hero_background_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."home" ADD CONSTRAINT "home_hero_card_image_id_media_id_fk" FOREIGN KEY ("hero_card_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."home" ADD CONSTRAINT "home_hero_card_frame_id_media_id_fk" FOREIGN KEY ("hero_card_frame_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."home" ADD CONSTRAINT "home_services_texture_id_media_id_fk" FOREIGN KEY ("services_texture_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."home" ADD CONSTRAINT "home_services_iso_id_media_id_fk" FOREIGN KEY ("services_iso_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."home" ADD CONSTRAINT "home_showcase_image_id_media_id_fk" FOREIGN KEY ("showcase_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."home" ADD CONSTRAINT "home_process_texture_id_media_id_fk" FOREIGN KEY ("process_texture_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."home" ADD CONSTRAINT "home_process_iso_id_media_id_fk" FOREIGN KEY ("process_iso_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."home" ADD CONSTRAINT "home_pricing_card_image_id_media_id_fk" FOREIGN KEY ("pricing_card_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."home" ADD CONSTRAINT "home_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."home_rels" ADD CONSTRAINT "home_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "jomiez_site"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."home_rels" ADD CONSTRAINT "home_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "jomiez_site"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_home_v_version_services_items" ADD CONSTRAINT "_home_v_version_services_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_home_v_version_mission_features" ADD CONSTRAINT "_home_v_version_mission_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_home_v_version_tenets_items" ADD CONSTRAINT "_home_v_version_tenets_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_home_v_version_process_steps" ADD CONSTRAINT "_home_v_version_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_home_v_version_studio_disciplines" ADD CONSTRAINT "_home_v_version_studio_disciplines_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_home_v_version_studio_disciplines" ADD CONSTRAINT "_home_v_version_studio_disciplines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_home_v_version_pricing_tiers_features" ADD CONSTRAINT "_home_v_version_pricing_tiers_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_home_v_version_pricing_tiers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_home_v_version_pricing_tiers" ADD CONSTRAINT "_home_v_version_pricing_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_home_v_version_faq_items" ADD CONSTRAINT "_home_v_version_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_home_v" ADD CONSTRAINT "_home_v_version_hero_background_id_media_id_fk" FOREIGN KEY ("version_hero_background_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_home_v" ADD CONSTRAINT "_home_v_version_hero_card_image_id_media_id_fk" FOREIGN KEY ("version_hero_card_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_home_v" ADD CONSTRAINT "_home_v_version_hero_card_frame_id_media_id_fk" FOREIGN KEY ("version_hero_card_frame_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_home_v" ADD CONSTRAINT "_home_v_version_services_texture_id_media_id_fk" FOREIGN KEY ("version_services_texture_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_home_v" ADD CONSTRAINT "_home_v_version_services_iso_id_media_id_fk" FOREIGN KEY ("version_services_iso_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_home_v" ADD CONSTRAINT "_home_v_version_showcase_image_id_media_id_fk" FOREIGN KEY ("version_showcase_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_home_v" ADD CONSTRAINT "_home_v_version_process_texture_id_media_id_fk" FOREIGN KEY ("version_process_texture_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_home_v" ADD CONSTRAINT "_home_v_version_process_iso_id_media_id_fk" FOREIGN KEY ("version_process_iso_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_home_v" ADD CONSTRAINT "_home_v_version_pricing_card_image_id_media_id_fk" FOREIGN KEY ("version_pricing_card_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_home_v" ADD CONSTRAINT "_home_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_home_v_rels" ADD CONSTRAINT "_home_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "jomiez_site"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_home_v_rels" ADD CONSTRAINT "_home_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "jomiez_site"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."about_mosaic" ADD CONSTRAINT "about_mosaic_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."about_mosaic" ADD CONSTRAINT "about_mosaic_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."about_story_paragraphs" ADD CONSTRAINT "about_story_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."about_crafts_cards" ADD CONSTRAINT "about_crafts_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."about" ADD CONSTRAINT "about_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_about_v_version_mosaic" ADD CONSTRAINT "_about_v_version_mosaic_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_about_v_version_mosaic" ADD CONSTRAINT "_about_v_version_mosaic_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_about_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_about_v_version_story_paragraphs" ADD CONSTRAINT "_about_v_version_story_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_about_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_about_v_version_crafts_cards" ADD CONSTRAINT "_about_v_version_crafts_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_about_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_about_v" ADD CONSTRAINT "_about_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."services_page_list_items" ADD CONSTRAINT "services_page_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."services_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."services_page" ADD CONSTRAINT "services_page_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_services_page_v_version_list_items" ADD CONSTRAINT "_services_page_v_version_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_services_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_services_page_v" ADD CONSTRAINT "_services_page_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."work_page" ADD CONSTRAINT "work_page_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."work_page" ADD CONSTRAINT "work_page_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_work_page_v" ADD CONSTRAINT "_work_page_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_work_page_v" ADD CONSTRAINT "_work_page_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."journal_page" ADD CONSTRAINT "journal_page_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_journal_page_v" ADD CONSTRAINT "_journal_page_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."contact_page_split_form_budgets" ADD CONSTRAINT "contact_page_split_form_budgets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."contact_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."contact_page" ADD CONSTRAINT "contact_page_split_image_id_media_id_fk" FOREIGN KEY ("split_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."contact_page" ADD CONSTRAINT "contact_page_call_image_id_media_id_fk" FOREIGN KEY ("call_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."contact_page" ADD CONSTRAINT "contact_page_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_contact_page_v_version_split_form_budgets" ADD CONSTRAINT "_contact_page_v_version_split_form_budgets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_contact_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_contact_page_v" ADD CONSTRAINT "_contact_page_v_version_split_image_id_media_id_fk" FOREIGN KEY ("version_split_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_contact_page_v" ADD CONSTRAINT "_contact_page_v_version_call_image_id_media_id_fk" FOREIGN KEY ("version_call_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_contact_page_v" ADD CONSTRAINT "_contact_page_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."navigation_header_links" ADD CONSTRAINT "navigation_header_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."navigation_footer_columns_links" ADD CONSTRAINT "navigation_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."navigation_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."navigation_footer_columns" ADD CONSTRAINT "navigation_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."navigation" ADD CONSTRAINT "navigation_footer_background_id_media_id_fk" FOREIGN KEY ("footer_background_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_navigation_v_version_header_links" ADD CONSTRAINT "_navigation_v_version_header_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_navigation_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_navigation_v_version_footer_columns_links" ADD CONSTRAINT "_navigation_v_version_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_navigation_v_version_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_navigation_v_version_footer_columns" ADD CONSTRAINT "_navigation_v_version_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_navigation_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_navigation_v" ADD CONSTRAINT "_navigation_v_version_footer_background_id_media_id_fk" FOREIGN KEY ("version_footer_background_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."site_stats" ADD CONSTRAINT "site_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."site"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."site_stack" ADD CONSTRAINT "site_stack_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."site"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."site_socials" ADD CONSTRAINT "site_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."site"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."site" ADD CONSTRAINT "site_founder_photo_id_media_id_fk" FOREIGN KEY ("founder_photo_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."site" ADD CONSTRAINT "site_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."site_rels" ADD CONSTRAINT "site_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "jomiez_site"."site"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."site_rels" ADD CONSTRAINT "site_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "jomiez_site"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_site_v_version_stats" ADD CONSTRAINT "_site_v_version_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_site_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_site_v_version_stack" ADD CONSTRAINT "_site_v_version_stack_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_site_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_site_v_version_socials" ADD CONSTRAINT "_site_v_version_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_site_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_site_v" ADD CONSTRAINT "_site_v_version_founder_photo_id_media_id_fk" FOREIGN KEY ("version_founder_photo_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_site_v" ADD CONSTRAINT "_site_v_version_og_image_id_media_id_fk" FOREIGN KEY ("version_og_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_site_v_rels" ADD CONSTRAINT "_site_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "jomiez_site"."_site_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_site_v_rels" ADD CONSTRAINT "_site_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "jomiez_site"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."privacy_sections_items" ADD CONSTRAINT "privacy_sections_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."privacy_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."privacy_sections" ADD CONSTRAINT "privacy_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."privacy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."privacy" ADD CONSTRAINT "privacy_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_privacy_v_version_sections_items" ADD CONSTRAINT "_privacy_v_version_sections_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_privacy_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_privacy_v_version_sections" ADD CONSTRAINT "_privacy_v_version_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_privacy_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_privacy_v" ADD CONSTRAINT "_privacy_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."terms_sections_items" ADD CONSTRAINT "terms_sections_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."terms_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."terms_sections" ADD CONSTRAINT "terms_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."terms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."terms" ADD CONSTRAINT "terms_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_terms_v_version_sections_items" ADD CONSTRAINT "_terms_v_version_sections_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_terms_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_terms_v_version_sections" ADD CONSTRAINT "_terms_v_version_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "jomiez_site"."_terms_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jomiez_site"."_terms_v" ADD CONSTRAINT "_terms_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "jomiez_site"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "inquiries_updated_at_idx" ON "jomiez_site"."inquiries" USING btree ("updated_at");
  CREATE INDEX "inquiries_created_at_idx" ON "jomiez_site"."inquiries" USING btree ("created_at");
  CREATE INDEX "agent_threads_owner_idx" ON "jomiez_site"."agent_threads" USING btree ("owner_id");
  CREATE INDEX "agent_threads_routine_idx" ON "jomiez_site"."agent_threads" USING btree ("routine_id");
  CREATE INDEX "agent_threads_updated_at_idx" ON "jomiez_site"."agent_threads" USING btree ("updated_at");
  CREATE INDEX "agent_threads_created_at_idx" ON "jomiez_site"."agent_threads" USING btree ("created_at");
  CREATE INDEX "agent_routines_owner_idx" ON "jomiez_site"."agent_routines" USING btree ("owner_id");
  CREATE INDEX "agent_routines_last_thread_idx" ON "jomiez_site"."agent_routines" USING btree ("last_thread_id");
  CREATE INDEX "agent_routines_updated_at_idx" ON "jomiez_site"."agent_routines" USING btree ("updated_at");
  CREATE INDEX "agent_routines_created_at_idx" ON "jomiez_site"."agent_routines" USING btree ("created_at");
  CREATE INDEX "agent_memory_updated_at_idx" ON "jomiez_site"."agent_memory" USING btree ("updated_at");
  CREATE INDEX "agent_memory_created_at_idx" ON "jomiez_site"."agent_memory" USING btree ("created_at");
  CREATE INDEX "pages_blocks_page_hero_order_idx" ON "jomiez_site"."pages_blocks_page_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_page_hero_parent_id_idx" ON "jomiez_site"."pages_blocks_page_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_page_hero_path_idx" ON "jomiez_site"."pages_blocks_page_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_content_order_idx" ON "jomiez_site"."pages_blocks_content" USING btree ("_order");
  CREATE INDEX "pages_blocks_content_parent_id_idx" ON "jomiez_site"."pages_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_content_path_idx" ON "jomiez_site"."pages_blocks_content" USING btree ("_path");
  CREATE INDEX "pages_blocks_image_band_order_idx" ON "jomiez_site"."pages_blocks_image_band" USING btree ("_order");
  CREATE INDEX "pages_blocks_image_band_parent_id_idx" ON "jomiez_site"."pages_blocks_image_band" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_image_band_path_idx" ON "jomiez_site"."pages_blocks_image_band" USING btree ("_path");
  CREATE INDEX "pages_blocks_image_band_image_idx" ON "jomiez_site"."pages_blocks_image_band" USING btree ("image_id");
  CREATE INDEX "pages_blocks_list_items_order_idx" ON "jomiez_site"."pages_blocks_list_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_list_items_parent_id_idx" ON "jomiez_site"."pages_blocks_list_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_list_order_idx" ON "jomiez_site"."pages_blocks_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_list_parent_id_idx" ON "jomiez_site"."pages_blocks_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_list_path_idx" ON "jomiez_site"."pages_blocks_list" USING btree ("_path");
  CREATE INDEX "pages_blocks_projects_order_idx" ON "jomiez_site"."pages_blocks_projects" USING btree ("_order");
  CREATE INDEX "pages_blocks_projects_parent_id_idx" ON "jomiez_site"."pages_blocks_projects" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_projects_path_idx" ON "jomiez_site"."pages_blocks_projects" USING btree ("_path");
  CREATE INDEX "pages_blocks_journal_order_idx" ON "jomiez_site"."pages_blocks_journal" USING btree ("_order");
  CREATE INDEX "pages_blocks_journal_parent_id_idx" ON "jomiez_site"."pages_blocks_journal" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_journal_path_idx" ON "jomiez_site"."pages_blocks_journal" USING btree ("_path");
  CREATE INDEX "pages_blocks_faq_custom_items_order_idx" ON "jomiez_site"."pages_blocks_faq_custom_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_custom_items_parent_id_idx" ON "jomiez_site"."pages_blocks_faq_custom_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_order_idx" ON "jomiez_site"."pages_blocks_faq" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_parent_id_idx" ON "jomiez_site"."pages_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_path_idx" ON "jomiez_site"."pages_blocks_faq" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta_order_idx" ON "jomiez_site"."pages_blocks_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_parent_id_idx" ON "jomiez_site"."pages_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_path_idx" ON "jomiez_site"."pages_blocks_cta" USING btree ("_path");
  CREATE INDEX "pages_blocks_tenets_order_idx" ON "jomiez_site"."pages_blocks_tenets" USING btree ("_order");
  CREATE INDEX "pages_blocks_tenets_parent_id_idx" ON "jomiez_site"."pages_blocks_tenets" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_tenets_path_idx" ON "jomiez_site"."pages_blocks_tenets" USING btree ("_path");
  CREATE INDEX "pages_blocks_pricing_order_idx" ON "jomiez_site"."pages_blocks_pricing" USING btree ("_order");
  CREATE INDEX "pages_blocks_pricing_parent_id_idx" ON "jomiez_site"."pages_blocks_pricing" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_pricing_path_idx" ON "jomiez_site"."pages_blocks_pricing" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "jomiez_site"."pages" USING btree ("slug");
  CREATE INDEX "pages_meta_meta_image_idx" ON "jomiez_site"."pages" USING btree ("meta_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "jomiez_site"."pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "jomiez_site"."pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "jomiez_site"."pages" USING btree ("_status");
  CREATE INDEX "pages_rels_order_idx" ON "jomiez_site"."pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "jomiez_site"."pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "jomiez_site"."pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_projects_id_idx" ON "jomiez_site"."pages_rels" USING btree ("projects_id");
  CREATE INDEX "_pages_v_blocks_page_hero_order_idx" ON "jomiez_site"."_pages_v_blocks_page_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_page_hero_parent_id_idx" ON "jomiez_site"."_pages_v_blocks_page_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_page_hero_path_idx" ON "jomiez_site"."_pages_v_blocks_page_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_content_order_idx" ON "jomiez_site"."_pages_v_blocks_content" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_content_parent_id_idx" ON "jomiez_site"."_pages_v_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_content_path_idx" ON "jomiez_site"."_pages_v_blocks_content" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_image_band_order_idx" ON "jomiez_site"."_pages_v_blocks_image_band" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_image_band_parent_id_idx" ON "jomiez_site"."_pages_v_blocks_image_band" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_image_band_path_idx" ON "jomiez_site"."_pages_v_blocks_image_band" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_image_band_image_idx" ON "jomiez_site"."_pages_v_blocks_image_band" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_list_items_order_idx" ON "jomiez_site"."_pages_v_blocks_list_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_list_items_parent_id_idx" ON "jomiez_site"."_pages_v_blocks_list_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_list_order_idx" ON "jomiez_site"."_pages_v_blocks_list" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_list_parent_id_idx" ON "jomiez_site"."_pages_v_blocks_list" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_list_path_idx" ON "jomiez_site"."_pages_v_blocks_list" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_projects_order_idx" ON "jomiez_site"."_pages_v_blocks_projects" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_projects_parent_id_idx" ON "jomiez_site"."_pages_v_blocks_projects" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_projects_path_idx" ON "jomiez_site"."_pages_v_blocks_projects" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_journal_order_idx" ON "jomiez_site"."_pages_v_blocks_journal" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_journal_parent_id_idx" ON "jomiez_site"."_pages_v_blocks_journal" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_journal_path_idx" ON "jomiez_site"."_pages_v_blocks_journal" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_faq_custom_items_order_idx" ON "jomiez_site"."_pages_v_blocks_faq_custom_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_custom_items_parent_id_idx" ON "jomiez_site"."_pages_v_blocks_faq_custom_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_order_idx" ON "jomiez_site"."_pages_v_blocks_faq" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_parent_id_idx" ON "jomiez_site"."_pages_v_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_path_idx" ON "jomiez_site"."_pages_v_blocks_faq" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cta_order_idx" ON "jomiez_site"."_pages_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_parent_id_idx" ON "jomiez_site"."_pages_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_path_idx" ON "jomiez_site"."_pages_v_blocks_cta" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_tenets_order_idx" ON "jomiez_site"."_pages_v_blocks_tenets" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_tenets_parent_id_idx" ON "jomiez_site"."_pages_v_blocks_tenets" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_tenets_path_idx" ON "jomiez_site"."_pages_v_blocks_tenets" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_pricing_order_idx" ON "jomiez_site"."_pages_v_blocks_pricing" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_pricing_parent_id_idx" ON "jomiez_site"."_pages_v_blocks_pricing" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_pricing_path_idx" ON "jomiez_site"."_pages_v_blocks_pricing" USING btree ("_path");
  CREATE INDEX "_pages_v_parent_idx" ON "jomiez_site"."_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "jomiez_site"."_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_meta_version_meta_image_idx" ON "jomiez_site"."_pages_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "jomiez_site"."_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "jomiez_site"."_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "jomiez_site"."_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "jomiez_site"."_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "jomiez_site"."_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "jomiez_site"."_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_autosave_idx" ON "jomiez_site"."_pages_v" USING btree ("autosave");
  CREATE INDEX "_pages_v_rels_order_idx" ON "jomiez_site"."_pages_v_rels" USING btree ("order");
  CREATE INDEX "_pages_v_rels_parent_idx" ON "jomiez_site"."_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_pages_v_rels_path_idx" ON "jomiez_site"."_pages_v_rels" USING btree ("path");
  CREATE INDEX "_pages_v_rels_projects_id_idx" ON "jomiez_site"."_pages_v_rels" USING btree ("projects_id");
  CREATE INDEX "projects_services_order_idx" ON "jomiez_site"."projects_services" USING btree ("_order");
  CREATE INDEX "projects_services_parent_id_idx" ON "jomiez_site"."projects_services" USING btree ("_parent_id");
  CREATE INDEX "projects_stats_order_idx" ON "jomiez_site"."projects_stats" USING btree ("_order");
  CREATE INDEX "projects_stats_parent_id_idx" ON "jomiez_site"."projects_stats" USING btree ("_parent_id");
  CREATE INDEX "projects_sections_points_order_idx" ON "jomiez_site"."projects_sections_points" USING btree ("_order");
  CREATE INDEX "projects_sections_points_parent_id_idx" ON "jomiez_site"."projects_sections_points" USING btree ("_parent_id");
  CREATE INDEX "projects_sections_order_idx" ON "jomiez_site"."projects_sections" USING btree ("_order");
  CREATE INDEX "projects_sections_parent_id_idx" ON "jomiez_site"."projects_sections" USING btree ("_parent_id");
  CREATE INDEX "projects_product_page_stats_order_idx" ON "jomiez_site"."projects_product_page_stats" USING btree ("_order");
  CREATE INDEX "projects_product_page_stats_parent_id_idx" ON "jomiez_site"."projects_product_page_stats" USING btree ("_parent_id");
  CREATE INDEX "projects_product_page_cards_order_idx" ON "jomiez_site"."projects_product_page_cards" USING btree ("_order");
  CREATE INDEX "projects_product_page_cards_parent_id_idx" ON "jomiez_site"."projects_product_page_cards" USING btree ("_parent_id");
  CREATE INDEX "projects_product_page_cards_art_idx" ON "jomiez_site"."projects_product_page_cards" USING btree ("art_id");
  CREATE INDEX "projects_product_page_system_features_order_idx" ON "jomiez_site"."projects_product_page_system_features" USING btree ("_order");
  CREATE INDEX "projects_product_page_system_features_parent_id_idx" ON "jomiez_site"."projects_product_page_system_features" USING btree ("_parent_id");
  CREATE INDEX "projects_product_page_faq_items_order_idx" ON "jomiez_site"."projects_product_page_faq_items" USING btree ("_order");
  CREATE INDEX "projects_product_page_faq_items_parent_id_idx" ON "jomiez_site"."projects_product_page_faq_items" USING btree ("_parent_id");
  CREATE INDEX "projects__order_idx" ON "jomiez_site"."projects" USING btree ("_order");
  CREATE INDEX "projects_image_idx" ON "jomiez_site"."projects" USING btree ("image_id");
  CREATE INDEX "projects_product_page_hero_product_page_hero_image_idx" ON "jomiez_site"."projects" USING btree ("product_page_hero_image_id");
  CREATE INDEX "projects_product_page_showcase_product_page_showcase_bac_idx" ON "jomiez_site"."projects" USING btree ("product_page_showcase_background_id");
  CREATE INDEX "projects_product_page_showcase_product_page_showcase_scr_idx" ON "jomiez_site"."projects" USING btree ("product_page_showcase_screen_id");
  CREATE INDEX "projects_meta_meta_image_idx" ON "jomiez_site"."projects" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "projects_slug_idx" ON "jomiez_site"."projects" USING btree ("slug");
  CREATE INDEX "projects_updated_at_idx" ON "jomiez_site"."projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "jomiez_site"."projects" USING btree ("created_at");
  CREATE INDEX "projects__status_idx" ON "jomiez_site"."projects" USING btree ("_status");
  CREATE INDEX "_projects_v_version_services_order_idx" ON "jomiez_site"."_projects_v_version_services" USING btree ("_order");
  CREATE INDEX "_projects_v_version_services_parent_id_idx" ON "jomiez_site"."_projects_v_version_services" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_stats_order_idx" ON "jomiez_site"."_projects_v_version_stats" USING btree ("_order");
  CREATE INDEX "_projects_v_version_stats_parent_id_idx" ON "jomiez_site"."_projects_v_version_stats" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_sections_points_order_idx" ON "jomiez_site"."_projects_v_version_sections_points" USING btree ("_order");
  CREATE INDEX "_projects_v_version_sections_points_parent_id_idx" ON "jomiez_site"."_projects_v_version_sections_points" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_sections_order_idx" ON "jomiez_site"."_projects_v_version_sections" USING btree ("_order");
  CREATE INDEX "_projects_v_version_sections_parent_id_idx" ON "jomiez_site"."_projects_v_version_sections" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_product_page_stats_order_idx" ON "jomiez_site"."_projects_v_version_product_page_stats" USING btree ("_order");
  CREATE INDEX "_projects_v_version_product_page_stats_parent_id_idx" ON "jomiez_site"."_projects_v_version_product_page_stats" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_product_page_cards_order_idx" ON "jomiez_site"."_projects_v_version_product_page_cards" USING btree ("_order");
  CREATE INDEX "_projects_v_version_product_page_cards_parent_id_idx" ON "jomiez_site"."_projects_v_version_product_page_cards" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_product_page_cards_art_idx" ON "jomiez_site"."_projects_v_version_product_page_cards" USING btree ("art_id");
  CREATE INDEX "_projects_v_version_product_page_system_features_order_idx" ON "jomiez_site"."_projects_v_version_product_page_system_features" USING btree ("_order");
  CREATE INDEX "_projects_v_version_product_page_system_features_parent_id_idx" ON "jomiez_site"."_projects_v_version_product_page_system_features" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_product_page_faq_items_order_idx" ON "jomiez_site"."_projects_v_version_product_page_faq_items" USING btree ("_order");
  CREATE INDEX "_projects_v_version_product_page_faq_items_parent_id_idx" ON "jomiez_site"."_projects_v_version_product_page_faq_items" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_parent_idx" ON "jomiez_site"."_projects_v" USING btree ("parent_id");
  CREATE INDEX "_projects_v_version_version__order_idx" ON "jomiez_site"."_projects_v" USING btree ("version__order");
  CREATE INDEX "_projects_v_version_version_image_idx" ON "jomiez_site"."_projects_v" USING btree ("version_image_id");
  CREATE INDEX "_projects_v_version_product_page_hero_version_product_pa_idx" ON "jomiez_site"."_projects_v" USING btree ("version_product_page_hero_image_id");
  CREATE INDEX "_projects_v_version_product_page_showcase_version_produc_idx" ON "jomiez_site"."_projects_v" USING btree ("version_product_page_showcase_background_id");
  CREATE INDEX "_projects_v_version_product_page_showcase_version_prod_1_idx" ON "jomiez_site"."_projects_v" USING btree ("version_product_page_showcase_screen_id");
  CREATE INDEX "_projects_v_version_meta_version_meta_image_idx" ON "jomiez_site"."_projects_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_projects_v_version_version_slug_idx" ON "jomiez_site"."_projects_v" USING btree ("version_slug");
  CREATE INDEX "_projects_v_version_version_updated_at_idx" ON "jomiez_site"."_projects_v" USING btree ("version_updated_at");
  CREATE INDEX "_projects_v_version_version_created_at_idx" ON "jomiez_site"."_projects_v" USING btree ("version_created_at");
  CREATE INDEX "_projects_v_version_version__status_idx" ON "jomiez_site"."_projects_v" USING btree ("version__status");
  CREATE INDEX "_projects_v_created_at_idx" ON "jomiez_site"."_projects_v" USING btree ("created_at");
  CREATE INDEX "_projects_v_updated_at_idx" ON "jomiez_site"."_projects_v" USING btree ("updated_at");
  CREATE INDEX "_projects_v_latest_idx" ON "jomiez_site"."_projects_v" USING btree ("latest");
  CREATE INDEX "_projects_v_autosave_idx" ON "jomiez_site"."_projects_v" USING btree ("autosave");
  CREATE INDEX "articles_image_idx" ON "jomiez_site"."articles" USING btree ("image_id");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "jomiez_site"."articles" USING btree ("slug");
  CREATE INDEX "articles_meta_meta_image_idx" ON "jomiez_site"."articles" USING btree ("meta_image_id");
  CREATE INDEX "articles_updated_at_idx" ON "jomiez_site"."articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "jomiez_site"."articles" USING btree ("created_at");
  CREATE INDEX "articles__status_idx" ON "jomiez_site"."articles" USING btree ("_status");
  CREATE INDEX "_articles_v_parent_idx" ON "jomiez_site"."_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_version_image_idx" ON "jomiez_site"."_articles_v" USING btree ("version_image_id");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "jomiez_site"."_articles_v" USING btree ("version_slug");
  CREATE INDEX "_articles_v_version_meta_version_meta_image_idx" ON "jomiez_site"."_articles_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "jomiez_site"."_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "jomiez_site"."_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "jomiez_site"."_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "jomiez_site"."_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "jomiez_site"."_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_latest_idx" ON "jomiez_site"."_articles_v" USING btree ("latest");
  CREATE INDEX "_articles_v_autosave_idx" ON "jomiez_site"."_articles_v" USING btree ("autosave");
  CREATE INDEX "media_updated_at_idx" ON "jomiez_site"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "jomiez_site"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "jomiez_site"."media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "jomiez_site"."media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "users_roles_order_idx" ON "jomiez_site"."users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "jomiez_site"."users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "jomiez_site"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "jomiez_site"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "jomiez_site"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "jomiez_site"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "jomiez_site"."users" USING btree ("email");
  CREATE UNIQUE INDEX "redirects_from_idx" ON "jomiez_site"."redirects" USING btree ("from");
  CREATE INDEX "redirects_updated_at_idx" ON "jomiez_site"."redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "jomiez_site"."redirects" USING btree ("created_at");
  CREATE INDEX "redirects_rels_order_idx" ON "jomiez_site"."redirects_rels" USING btree ("order");
  CREATE INDEX "redirects_rels_parent_idx" ON "jomiez_site"."redirects_rels" USING btree ("parent_id");
  CREATE INDEX "redirects_rels_path_idx" ON "jomiez_site"."redirects_rels" USING btree ("path");
  CREATE INDEX "redirects_rels_pages_id_idx" ON "jomiez_site"."redirects_rels" USING btree ("pages_id");
  CREATE INDEX "redirects_rels_projects_id_idx" ON "jomiez_site"."redirects_rels" USING btree ("projects_id");
  CREATE INDEX "redirects_rels_articles_id_idx" ON "jomiez_site"."redirects_rels" USING btree ("articles_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "jomiez_site"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "jomiez_site"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "jomiez_site"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "jomiez_site"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "jomiez_site"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "jomiez_site"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "jomiez_site"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_inquiries_id_idx" ON "jomiez_site"."payload_locked_documents_rels" USING btree ("inquiries_id");
  CREATE INDEX "payload_locked_documents_rels_agent_threads_id_idx" ON "jomiez_site"."payload_locked_documents_rels" USING btree ("agent_threads_id");
  CREATE INDEX "payload_locked_documents_rels_agent_routines_id_idx" ON "jomiez_site"."payload_locked_documents_rels" USING btree ("agent_routines_id");
  CREATE INDEX "payload_locked_documents_rels_agent_memory_id_idx" ON "jomiez_site"."payload_locked_documents_rels" USING btree ("agent_memory_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "jomiez_site"."payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "jomiez_site"."payload_locked_documents_rels" USING btree ("projects_id");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "jomiez_site"."payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "jomiez_site"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "jomiez_site"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "jomiez_site"."payload_locked_documents_rels" USING btree ("redirects_id");
  CREATE INDEX "payload_preferences_key_idx" ON "jomiez_site"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "jomiez_site"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "jomiez_site"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "jomiez_site"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "jomiez_site"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "jomiez_site"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "jomiez_site"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "jomiez_site"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "jomiez_site"."payload_migrations" USING btree ("created_at");
  CREATE INDEX "home_services_items_order_idx" ON "jomiez_site"."home_services_items" USING btree ("_order");
  CREATE INDEX "home_services_items_parent_id_idx" ON "jomiez_site"."home_services_items" USING btree ("_parent_id");
  CREATE INDEX "home_mission_features_order_idx" ON "jomiez_site"."home_mission_features" USING btree ("_order");
  CREATE INDEX "home_mission_features_parent_id_idx" ON "jomiez_site"."home_mission_features" USING btree ("_parent_id");
  CREATE INDEX "home_tenets_items_order_idx" ON "jomiez_site"."home_tenets_items" USING btree ("_order");
  CREATE INDEX "home_tenets_items_parent_id_idx" ON "jomiez_site"."home_tenets_items" USING btree ("_parent_id");
  CREATE INDEX "home_process_steps_order_idx" ON "jomiez_site"."home_process_steps" USING btree ("_order");
  CREATE INDEX "home_process_steps_parent_id_idx" ON "jomiez_site"."home_process_steps" USING btree ("_parent_id");
  CREATE INDEX "home_studio_disciplines_order_idx" ON "jomiez_site"."home_studio_disciplines" USING btree ("_order");
  CREATE INDEX "home_studio_disciplines_parent_id_idx" ON "jomiez_site"."home_studio_disciplines" USING btree ("_parent_id");
  CREATE INDEX "home_studio_disciplines_image_idx" ON "jomiez_site"."home_studio_disciplines" USING btree ("image_id");
  CREATE INDEX "home_pricing_tiers_features_order_idx" ON "jomiez_site"."home_pricing_tiers_features" USING btree ("_order");
  CREATE INDEX "home_pricing_tiers_features_parent_id_idx" ON "jomiez_site"."home_pricing_tiers_features" USING btree ("_parent_id");
  CREATE INDEX "home_pricing_tiers_order_idx" ON "jomiez_site"."home_pricing_tiers" USING btree ("_order");
  CREATE INDEX "home_pricing_tiers_parent_id_idx" ON "jomiez_site"."home_pricing_tiers" USING btree ("_parent_id");
  CREATE INDEX "home_faq_items_order_idx" ON "jomiez_site"."home_faq_items" USING btree ("_order");
  CREATE INDEX "home_faq_items_parent_id_idx" ON "jomiez_site"."home_faq_items" USING btree ("_parent_id");
  CREATE INDEX "home_hero_hero_background_idx" ON "jomiez_site"."home" USING btree ("hero_background_id");
  CREATE INDEX "home_hero_card_hero_card_image_idx" ON "jomiez_site"."home" USING btree ("hero_card_image_id");
  CREATE INDEX "home_hero_card_hero_card_frame_idx" ON "jomiez_site"."home" USING btree ("hero_card_frame_id");
  CREATE INDEX "home_services_services_texture_idx" ON "jomiez_site"."home" USING btree ("services_texture_id");
  CREATE INDEX "home_services_services_iso_idx" ON "jomiez_site"."home" USING btree ("services_iso_id");
  CREATE INDEX "home_showcase_showcase_image_idx" ON "jomiez_site"."home" USING btree ("showcase_image_id");
  CREATE INDEX "home_process_process_texture_idx" ON "jomiez_site"."home" USING btree ("process_texture_id");
  CREATE INDEX "home_process_process_iso_idx" ON "jomiez_site"."home" USING btree ("process_iso_id");
  CREATE INDEX "home_pricing_pricing_card_image_idx" ON "jomiez_site"."home" USING btree ("pricing_card_image_id");
  CREATE INDEX "home_meta_meta_image_idx" ON "jomiez_site"."home" USING btree ("meta_image_id");
  CREATE INDEX "home__status_idx" ON "jomiez_site"."home" USING btree ("_status");
  CREATE INDEX "home_rels_order_idx" ON "jomiez_site"."home_rels" USING btree ("order");
  CREATE INDEX "home_rels_parent_idx" ON "jomiez_site"."home_rels" USING btree ("parent_id");
  CREATE INDEX "home_rels_path_idx" ON "jomiez_site"."home_rels" USING btree ("path");
  CREATE INDEX "home_rels_projects_id_idx" ON "jomiez_site"."home_rels" USING btree ("projects_id");
  CREATE INDEX "_home_v_version_services_items_order_idx" ON "jomiez_site"."_home_v_version_services_items" USING btree ("_order");
  CREATE INDEX "_home_v_version_services_items_parent_id_idx" ON "jomiez_site"."_home_v_version_services_items" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_mission_features_order_idx" ON "jomiez_site"."_home_v_version_mission_features" USING btree ("_order");
  CREATE INDEX "_home_v_version_mission_features_parent_id_idx" ON "jomiez_site"."_home_v_version_mission_features" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_tenets_items_order_idx" ON "jomiez_site"."_home_v_version_tenets_items" USING btree ("_order");
  CREATE INDEX "_home_v_version_tenets_items_parent_id_idx" ON "jomiez_site"."_home_v_version_tenets_items" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_process_steps_order_idx" ON "jomiez_site"."_home_v_version_process_steps" USING btree ("_order");
  CREATE INDEX "_home_v_version_process_steps_parent_id_idx" ON "jomiez_site"."_home_v_version_process_steps" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_studio_disciplines_order_idx" ON "jomiez_site"."_home_v_version_studio_disciplines" USING btree ("_order");
  CREATE INDEX "_home_v_version_studio_disciplines_parent_id_idx" ON "jomiez_site"."_home_v_version_studio_disciplines" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_studio_disciplines_image_idx" ON "jomiez_site"."_home_v_version_studio_disciplines" USING btree ("image_id");
  CREATE INDEX "_home_v_version_pricing_tiers_features_order_idx" ON "jomiez_site"."_home_v_version_pricing_tiers_features" USING btree ("_order");
  CREATE INDEX "_home_v_version_pricing_tiers_features_parent_id_idx" ON "jomiez_site"."_home_v_version_pricing_tiers_features" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_pricing_tiers_order_idx" ON "jomiez_site"."_home_v_version_pricing_tiers" USING btree ("_order");
  CREATE INDEX "_home_v_version_pricing_tiers_parent_id_idx" ON "jomiez_site"."_home_v_version_pricing_tiers" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_faq_items_order_idx" ON "jomiez_site"."_home_v_version_faq_items" USING btree ("_order");
  CREATE INDEX "_home_v_version_faq_items_parent_id_idx" ON "jomiez_site"."_home_v_version_faq_items" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_hero_version_hero_background_idx" ON "jomiez_site"."_home_v" USING btree ("version_hero_background_id");
  CREATE INDEX "_home_v_version_hero_card_version_hero_card_image_idx" ON "jomiez_site"."_home_v" USING btree ("version_hero_card_image_id");
  CREATE INDEX "_home_v_version_hero_card_version_hero_card_frame_idx" ON "jomiez_site"."_home_v" USING btree ("version_hero_card_frame_id");
  CREATE INDEX "_home_v_version_services_version_services_texture_idx" ON "jomiez_site"."_home_v" USING btree ("version_services_texture_id");
  CREATE INDEX "_home_v_version_services_version_services_iso_idx" ON "jomiez_site"."_home_v" USING btree ("version_services_iso_id");
  CREATE INDEX "_home_v_version_showcase_version_showcase_image_idx" ON "jomiez_site"."_home_v" USING btree ("version_showcase_image_id");
  CREATE INDEX "_home_v_version_process_version_process_texture_idx" ON "jomiez_site"."_home_v" USING btree ("version_process_texture_id");
  CREATE INDEX "_home_v_version_process_version_process_iso_idx" ON "jomiez_site"."_home_v" USING btree ("version_process_iso_id");
  CREATE INDEX "_home_v_version_pricing_version_pricing_card_image_idx" ON "jomiez_site"."_home_v" USING btree ("version_pricing_card_image_id");
  CREATE INDEX "_home_v_version_meta_version_meta_image_idx" ON "jomiez_site"."_home_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_home_v_version_version__status_idx" ON "jomiez_site"."_home_v" USING btree ("version__status");
  CREATE INDEX "_home_v_created_at_idx" ON "jomiez_site"."_home_v" USING btree ("created_at");
  CREATE INDEX "_home_v_updated_at_idx" ON "jomiez_site"."_home_v" USING btree ("updated_at");
  CREATE INDEX "_home_v_latest_idx" ON "jomiez_site"."_home_v" USING btree ("latest");
  CREATE INDEX "_home_v_autosave_idx" ON "jomiez_site"."_home_v" USING btree ("autosave");
  CREATE INDEX "_home_v_rels_order_idx" ON "jomiez_site"."_home_v_rels" USING btree ("order");
  CREATE INDEX "_home_v_rels_parent_idx" ON "jomiez_site"."_home_v_rels" USING btree ("parent_id");
  CREATE INDEX "_home_v_rels_path_idx" ON "jomiez_site"."_home_v_rels" USING btree ("path");
  CREATE INDEX "_home_v_rels_projects_id_idx" ON "jomiez_site"."_home_v_rels" USING btree ("projects_id");
  CREATE INDEX "about_mosaic_order_idx" ON "jomiez_site"."about_mosaic" USING btree ("_order");
  CREATE INDEX "about_mosaic_parent_id_idx" ON "jomiez_site"."about_mosaic" USING btree ("_parent_id");
  CREATE INDEX "about_mosaic_image_idx" ON "jomiez_site"."about_mosaic" USING btree ("image_id");
  CREATE INDEX "about_story_paragraphs_order_idx" ON "jomiez_site"."about_story_paragraphs" USING btree ("_order");
  CREATE INDEX "about_story_paragraphs_parent_id_idx" ON "jomiez_site"."about_story_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "about_crafts_cards_order_idx" ON "jomiez_site"."about_crafts_cards" USING btree ("_order");
  CREATE INDEX "about_crafts_cards_parent_id_idx" ON "jomiez_site"."about_crafts_cards" USING btree ("_parent_id");
  CREATE INDEX "about_meta_meta_image_idx" ON "jomiez_site"."about" USING btree ("meta_image_id");
  CREATE INDEX "about__status_idx" ON "jomiez_site"."about" USING btree ("_status");
  CREATE INDEX "_about_v_version_mosaic_order_idx" ON "jomiez_site"."_about_v_version_mosaic" USING btree ("_order");
  CREATE INDEX "_about_v_version_mosaic_parent_id_idx" ON "jomiez_site"."_about_v_version_mosaic" USING btree ("_parent_id");
  CREATE INDEX "_about_v_version_mosaic_image_idx" ON "jomiez_site"."_about_v_version_mosaic" USING btree ("image_id");
  CREATE INDEX "_about_v_version_story_paragraphs_order_idx" ON "jomiez_site"."_about_v_version_story_paragraphs" USING btree ("_order");
  CREATE INDEX "_about_v_version_story_paragraphs_parent_id_idx" ON "jomiez_site"."_about_v_version_story_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "_about_v_version_crafts_cards_order_idx" ON "jomiez_site"."_about_v_version_crafts_cards" USING btree ("_order");
  CREATE INDEX "_about_v_version_crafts_cards_parent_id_idx" ON "jomiez_site"."_about_v_version_crafts_cards" USING btree ("_parent_id");
  CREATE INDEX "_about_v_version_meta_version_meta_image_idx" ON "jomiez_site"."_about_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_about_v_version_version__status_idx" ON "jomiez_site"."_about_v" USING btree ("version__status");
  CREATE INDEX "_about_v_created_at_idx" ON "jomiez_site"."_about_v" USING btree ("created_at");
  CREATE INDEX "_about_v_updated_at_idx" ON "jomiez_site"."_about_v" USING btree ("updated_at");
  CREATE INDEX "_about_v_latest_idx" ON "jomiez_site"."_about_v" USING btree ("latest");
  CREATE INDEX "_about_v_autosave_idx" ON "jomiez_site"."_about_v" USING btree ("autosave");
  CREATE INDEX "services_page_list_items_order_idx" ON "jomiez_site"."services_page_list_items" USING btree ("_order");
  CREATE INDEX "services_page_list_items_parent_id_idx" ON "jomiez_site"."services_page_list_items" USING btree ("_parent_id");
  CREATE INDEX "services_page_meta_meta_image_idx" ON "jomiez_site"."services_page" USING btree ("meta_image_id");
  CREATE INDEX "services_page__status_idx" ON "jomiez_site"."services_page" USING btree ("_status");
  CREATE INDEX "_services_page_v_version_list_items_order_idx" ON "jomiez_site"."_services_page_v_version_list_items" USING btree ("_order");
  CREATE INDEX "_services_page_v_version_list_items_parent_id_idx" ON "jomiez_site"."_services_page_v_version_list_items" USING btree ("_parent_id");
  CREATE INDEX "_services_page_v_version_meta_version_meta_image_idx" ON "jomiez_site"."_services_page_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_services_page_v_version_version__status_idx" ON "jomiez_site"."_services_page_v" USING btree ("version__status");
  CREATE INDEX "_services_page_v_created_at_idx" ON "jomiez_site"."_services_page_v" USING btree ("created_at");
  CREATE INDEX "_services_page_v_updated_at_idx" ON "jomiez_site"."_services_page_v" USING btree ("updated_at");
  CREATE INDEX "_services_page_v_latest_idx" ON "jomiez_site"."_services_page_v" USING btree ("latest");
  CREATE INDEX "_services_page_v_autosave_idx" ON "jomiez_site"."_services_page_v" USING btree ("autosave");
  CREATE INDEX "work_page_image_idx" ON "jomiez_site"."work_page" USING btree ("image_id");
  CREATE INDEX "work_page_meta_meta_image_idx" ON "jomiez_site"."work_page" USING btree ("meta_image_id");
  CREATE INDEX "work_page__status_idx" ON "jomiez_site"."work_page" USING btree ("_status");
  CREATE INDEX "_work_page_v_version_version_image_idx" ON "jomiez_site"."_work_page_v" USING btree ("version_image_id");
  CREATE INDEX "_work_page_v_version_meta_version_meta_image_idx" ON "jomiez_site"."_work_page_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_work_page_v_version_version__status_idx" ON "jomiez_site"."_work_page_v" USING btree ("version__status");
  CREATE INDEX "_work_page_v_created_at_idx" ON "jomiez_site"."_work_page_v" USING btree ("created_at");
  CREATE INDEX "_work_page_v_updated_at_idx" ON "jomiez_site"."_work_page_v" USING btree ("updated_at");
  CREATE INDEX "_work_page_v_latest_idx" ON "jomiez_site"."_work_page_v" USING btree ("latest");
  CREATE INDEX "_work_page_v_autosave_idx" ON "jomiez_site"."_work_page_v" USING btree ("autosave");
  CREATE INDEX "journal_page_meta_meta_image_idx" ON "jomiez_site"."journal_page" USING btree ("meta_image_id");
  CREATE INDEX "journal_page__status_idx" ON "jomiez_site"."journal_page" USING btree ("_status");
  CREATE INDEX "_journal_page_v_version_meta_version_meta_image_idx" ON "jomiez_site"."_journal_page_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_journal_page_v_version_version__status_idx" ON "jomiez_site"."_journal_page_v" USING btree ("version__status");
  CREATE INDEX "_journal_page_v_created_at_idx" ON "jomiez_site"."_journal_page_v" USING btree ("created_at");
  CREATE INDEX "_journal_page_v_updated_at_idx" ON "jomiez_site"."_journal_page_v" USING btree ("updated_at");
  CREATE INDEX "_journal_page_v_latest_idx" ON "jomiez_site"."_journal_page_v" USING btree ("latest");
  CREATE INDEX "_journal_page_v_autosave_idx" ON "jomiez_site"."_journal_page_v" USING btree ("autosave");
  CREATE INDEX "contact_page_split_form_budgets_order_idx" ON "jomiez_site"."contact_page_split_form_budgets" USING btree ("_order");
  CREATE INDEX "contact_page_split_form_budgets_parent_id_idx" ON "jomiez_site"."contact_page_split_form_budgets" USING btree ("_parent_id");
  CREATE INDEX "contact_page_split_split_image_idx" ON "jomiez_site"."contact_page" USING btree ("split_image_id");
  CREATE INDEX "contact_page_call_call_image_idx" ON "jomiez_site"."contact_page" USING btree ("call_image_id");
  CREATE INDEX "contact_page_meta_meta_image_idx" ON "jomiez_site"."contact_page" USING btree ("meta_image_id");
  CREATE INDEX "contact_page__status_idx" ON "jomiez_site"."contact_page" USING btree ("_status");
  CREATE INDEX "_contact_page_v_version_split_form_budgets_order_idx" ON "jomiez_site"."_contact_page_v_version_split_form_budgets" USING btree ("_order");
  CREATE INDEX "_contact_page_v_version_split_form_budgets_parent_id_idx" ON "jomiez_site"."_contact_page_v_version_split_form_budgets" USING btree ("_parent_id");
  CREATE INDEX "_contact_page_v_version_split_version_split_image_idx" ON "jomiez_site"."_contact_page_v" USING btree ("version_split_image_id");
  CREATE INDEX "_contact_page_v_version_call_version_call_image_idx" ON "jomiez_site"."_contact_page_v" USING btree ("version_call_image_id");
  CREATE INDEX "_contact_page_v_version_meta_version_meta_image_idx" ON "jomiez_site"."_contact_page_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_contact_page_v_version_version__status_idx" ON "jomiez_site"."_contact_page_v" USING btree ("version__status");
  CREATE INDEX "_contact_page_v_created_at_idx" ON "jomiez_site"."_contact_page_v" USING btree ("created_at");
  CREATE INDEX "_contact_page_v_updated_at_idx" ON "jomiez_site"."_contact_page_v" USING btree ("updated_at");
  CREATE INDEX "_contact_page_v_latest_idx" ON "jomiez_site"."_contact_page_v" USING btree ("latest");
  CREATE INDEX "_contact_page_v_autosave_idx" ON "jomiez_site"."_contact_page_v" USING btree ("autosave");
  CREATE INDEX "navigation_header_links_order_idx" ON "jomiez_site"."navigation_header_links" USING btree ("_order");
  CREATE INDEX "navigation_header_links_parent_id_idx" ON "jomiez_site"."navigation_header_links" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_columns_links_order_idx" ON "jomiez_site"."navigation_footer_columns_links" USING btree ("_order");
  CREATE INDEX "navigation_footer_columns_links_parent_id_idx" ON "jomiez_site"."navigation_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_columns_order_idx" ON "jomiez_site"."navigation_footer_columns" USING btree ("_order");
  CREATE INDEX "navigation_footer_columns_parent_id_idx" ON "jomiez_site"."navigation_footer_columns" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_footer_background_idx" ON "jomiez_site"."navigation" USING btree ("footer_background_id");
  CREATE INDEX "navigation__status_idx" ON "jomiez_site"."navigation" USING btree ("_status");
  CREATE INDEX "_navigation_v_version_header_links_order_idx" ON "jomiez_site"."_navigation_v_version_header_links" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_header_links_parent_id_idx" ON "jomiez_site"."_navigation_v_version_header_links" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_footer_columns_links_order_idx" ON "jomiez_site"."_navigation_v_version_footer_columns_links" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_footer_columns_links_parent_id_idx" ON "jomiez_site"."_navigation_v_version_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_footer_columns_order_idx" ON "jomiez_site"."_navigation_v_version_footer_columns" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_footer_columns_parent_id_idx" ON "jomiez_site"."_navigation_v_version_footer_columns" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_footer_version_footer_background_idx" ON "jomiez_site"."_navigation_v" USING btree ("version_footer_background_id");
  CREATE INDEX "_navigation_v_version_version__status_idx" ON "jomiez_site"."_navigation_v" USING btree ("version__status");
  CREATE INDEX "_navigation_v_created_at_idx" ON "jomiez_site"."_navigation_v" USING btree ("created_at");
  CREATE INDEX "_navigation_v_updated_at_idx" ON "jomiez_site"."_navigation_v" USING btree ("updated_at");
  CREATE INDEX "_navigation_v_latest_idx" ON "jomiez_site"."_navigation_v" USING btree ("latest");
  CREATE INDEX "_navigation_v_autosave_idx" ON "jomiez_site"."_navigation_v" USING btree ("autosave");
  CREATE INDEX "site_stats_order_idx" ON "jomiez_site"."site_stats" USING btree ("_order");
  CREATE INDEX "site_stats_parent_id_idx" ON "jomiez_site"."site_stats" USING btree ("_parent_id");
  CREATE INDEX "site_stack_order_idx" ON "jomiez_site"."site_stack" USING btree ("_order");
  CREATE INDEX "site_stack_parent_id_idx" ON "jomiez_site"."site_stack" USING btree ("_parent_id");
  CREATE INDEX "site_socials_order_idx" ON "jomiez_site"."site_socials" USING btree ("_order");
  CREATE INDEX "site_socials_parent_id_idx" ON "jomiez_site"."site_socials" USING btree ("_parent_id");
  CREATE INDEX "site_founder_founder_photo_idx" ON "jomiez_site"."site" USING btree ("founder_photo_id");
  CREATE INDEX "site_og_image_idx" ON "jomiez_site"."site" USING btree ("og_image_id");
  CREATE INDEX "site_rels_order_idx" ON "jomiez_site"."site_rels" USING btree ("order");
  CREATE INDEX "site_rels_parent_idx" ON "jomiez_site"."site_rels" USING btree ("parent_id");
  CREATE INDEX "site_rels_path_idx" ON "jomiez_site"."site_rels" USING btree ("path");
  CREATE INDEX "site_rels_media_id_idx" ON "jomiez_site"."site_rels" USING btree ("media_id");
  CREATE INDEX "_site_v_version_stats_order_idx" ON "jomiez_site"."_site_v_version_stats" USING btree ("_order");
  CREATE INDEX "_site_v_version_stats_parent_id_idx" ON "jomiez_site"."_site_v_version_stats" USING btree ("_parent_id");
  CREATE INDEX "_site_v_version_stack_order_idx" ON "jomiez_site"."_site_v_version_stack" USING btree ("_order");
  CREATE INDEX "_site_v_version_stack_parent_id_idx" ON "jomiez_site"."_site_v_version_stack" USING btree ("_parent_id");
  CREATE INDEX "_site_v_version_socials_order_idx" ON "jomiez_site"."_site_v_version_socials" USING btree ("_order");
  CREATE INDEX "_site_v_version_socials_parent_id_idx" ON "jomiez_site"."_site_v_version_socials" USING btree ("_parent_id");
  CREATE INDEX "_site_v_version_founder_version_founder_photo_idx" ON "jomiez_site"."_site_v" USING btree ("version_founder_photo_id");
  CREATE INDEX "_site_v_version_version_og_image_idx" ON "jomiez_site"."_site_v" USING btree ("version_og_image_id");
  CREATE INDEX "_site_v_created_at_idx" ON "jomiez_site"."_site_v" USING btree ("created_at");
  CREATE INDEX "_site_v_updated_at_idx" ON "jomiez_site"."_site_v" USING btree ("updated_at");
  CREATE INDEX "_site_v_rels_order_idx" ON "jomiez_site"."_site_v_rels" USING btree ("order");
  CREATE INDEX "_site_v_rels_parent_idx" ON "jomiez_site"."_site_v_rels" USING btree ("parent_id");
  CREATE INDEX "_site_v_rels_path_idx" ON "jomiez_site"."_site_v_rels" USING btree ("path");
  CREATE INDEX "_site_v_rels_media_id_idx" ON "jomiez_site"."_site_v_rels" USING btree ("media_id");
  CREATE INDEX "_effects_v_created_at_idx" ON "jomiez_site"."_effects_v" USING btree ("created_at");
  CREATE INDEX "_effects_v_updated_at_idx" ON "jomiez_site"."_effects_v" USING btree ("updated_at");
  CREATE INDEX "not_found__status_idx" ON "jomiez_site"."not_found" USING btree ("_status");
  CREATE INDEX "_not_found_v_version_version__status_idx" ON "jomiez_site"."_not_found_v" USING btree ("version__status");
  CREATE INDEX "_not_found_v_created_at_idx" ON "jomiez_site"."_not_found_v" USING btree ("created_at");
  CREATE INDEX "_not_found_v_updated_at_idx" ON "jomiez_site"."_not_found_v" USING btree ("updated_at");
  CREATE INDEX "_not_found_v_latest_idx" ON "jomiez_site"."_not_found_v" USING btree ("latest");
  CREATE INDEX "_not_found_v_autosave_idx" ON "jomiez_site"."_not_found_v" USING btree ("autosave");
  CREATE INDEX "privacy_sections_items_order_idx" ON "jomiez_site"."privacy_sections_items" USING btree ("_order");
  CREATE INDEX "privacy_sections_items_parent_id_idx" ON "jomiez_site"."privacy_sections_items" USING btree ("_parent_id");
  CREATE INDEX "privacy_sections_order_idx" ON "jomiez_site"."privacy_sections" USING btree ("_order");
  CREATE INDEX "privacy_sections_parent_id_idx" ON "jomiez_site"."privacy_sections" USING btree ("_parent_id");
  CREATE INDEX "privacy_meta_meta_image_idx" ON "jomiez_site"."privacy" USING btree ("meta_image_id");
  CREATE INDEX "privacy__status_idx" ON "jomiez_site"."privacy" USING btree ("_status");
  CREATE INDEX "_privacy_v_version_sections_items_order_idx" ON "jomiez_site"."_privacy_v_version_sections_items" USING btree ("_order");
  CREATE INDEX "_privacy_v_version_sections_items_parent_id_idx" ON "jomiez_site"."_privacy_v_version_sections_items" USING btree ("_parent_id");
  CREATE INDEX "_privacy_v_version_sections_order_idx" ON "jomiez_site"."_privacy_v_version_sections" USING btree ("_order");
  CREATE INDEX "_privacy_v_version_sections_parent_id_idx" ON "jomiez_site"."_privacy_v_version_sections" USING btree ("_parent_id");
  CREATE INDEX "_privacy_v_version_meta_version_meta_image_idx" ON "jomiez_site"."_privacy_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_privacy_v_version_version__status_idx" ON "jomiez_site"."_privacy_v" USING btree ("version__status");
  CREATE INDEX "_privacy_v_created_at_idx" ON "jomiez_site"."_privacy_v" USING btree ("created_at");
  CREATE INDEX "_privacy_v_updated_at_idx" ON "jomiez_site"."_privacy_v" USING btree ("updated_at");
  CREATE INDEX "_privacy_v_latest_idx" ON "jomiez_site"."_privacy_v" USING btree ("latest");
  CREATE INDEX "_privacy_v_autosave_idx" ON "jomiez_site"."_privacy_v" USING btree ("autosave");
  CREATE INDEX "terms_sections_items_order_idx" ON "jomiez_site"."terms_sections_items" USING btree ("_order");
  CREATE INDEX "terms_sections_items_parent_id_idx" ON "jomiez_site"."terms_sections_items" USING btree ("_parent_id");
  CREATE INDEX "terms_sections_order_idx" ON "jomiez_site"."terms_sections" USING btree ("_order");
  CREATE INDEX "terms_sections_parent_id_idx" ON "jomiez_site"."terms_sections" USING btree ("_parent_id");
  CREATE INDEX "terms_meta_meta_image_idx" ON "jomiez_site"."terms" USING btree ("meta_image_id");
  CREATE INDEX "terms__status_idx" ON "jomiez_site"."terms" USING btree ("_status");
  CREATE INDEX "_terms_v_version_sections_items_order_idx" ON "jomiez_site"."_terms_v_version_sections_items" USING btree ("_order");
  CREATE INDEX "_terms_v_version_sections_items_parent_id_idx" ON "jomiez_site"."_terms_v_version_sections_items" USING btree ("_parent_id");
  CREATE INDEX "_terms_v_version_sections_order_idx" ON "jomiez_site"."_terms_v_version_sections" USING btree ("_order");
  CREATE INDEX "_terms_v_version_sections_parent_id_idx" ON "jomiez_site"."_terms_v_version_sections" USING btree ("_parent_id");
  CREATE INDEX "_terms_v_version_meta_version_meta_image_idx" ON "jomiez_site"."_terms_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_terms_v_version_version__status_idx" ON "jomiez_site"."_terms_v" USING btree ("version__status");
  CREATE INDEX "_terms_v_created_at_idx" ON "jomiez_site"."_terms_v" USING btree ("created_at");
  CREATE INDEX "_terms_v_updated_at_idx" ON "jomiez_site"."_terms_v" USING btree ("updated_at");
  CREATE INDEX "_terms_v_latest_idx" ON "jomiez_site"."_terms_v" USING btree ("latest");
  CREATE INDEX "_terms_v_autosave_idx" ON "jomiez_site"."_terms_v" USING btree ("autosave");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "jomiez_site"."inquiries" CASCADE;
  DROP TABLE "jomiez_site"."agent_threads" CASCADE;
  DROP TABLE "jomiez_site"."agent_routines" CASCADE;
  DROP TABLE "jomiez_site"."agent_memory" CASCADE;
  DROP TABLE "jomiez_site"."pages_blocks_page_hero" CASCADE;
  DROP TABLE "jomiez_site"."pages_blocks_content" CASCADE;
  DROP TABLE "jomiez_site"."pages_blocks_image_band" CASCADE;
  DROP TABLE "jomiez_site"."pages_blocks_list_items" CASCADE;
  DROP TABLE "jomiez_site"."pages_blocks_list" CASCADE;
  DROP TABLE "jomiez_site"."pages_blocks_projects" CASCADE;
  DROP TABLE "jomiez_site"."pages_blocks_journal" CASCADE;
  DROP TABLE "jomiez_site"."pages_blocks_faq_custom_items" CASCADE;
  DROP TABLE "jomiez_site"."pages_blocks_faq" CASCADE;
  DROP TABLE "jomiez_site"."pages_blocks_cta" CASCADE;
  DROP TABLE "jomiez_site"."pages_blocks_tenets" CASCADE;
  DROP TABLE "jomiez_site"."pages_blocks_pricing" CASCADE;
  DROP TABLE "jomiez_site"."pages" CASCADE;
  DROP TABLE "jomiez_site"."pages_rels" CASCADE;
  DROP TABLE "jomiez_site"."_pages_v_blocks_page_hero" CASCADE;
  DROP TABLE "jomiez_site"."_pages_v_blocks_content" CASCADE;
  DROP TABLE "jomiez_site"."_pages_v_blocks_image_band" CASCADE;
  DROP TABLE "jomiez_site"."_pages_v_blocks_list_items" CASCADE;
  DROP TABLE "jomiez_site"."_pages_v_blocks_list" CASCADE;
  DROP TABLE "jomiez_site"."_pages_v_blocks_projects" CASCADE;
  DROP TABLE "jomiez_site"."_pages_v_blocks_journal" CASCADE;
  DROP TABLE "jomiez_site"."_pages_v_blocks_faq_custom_items" CASCADE;
  DROP TABLE "jomiez_site"."_pages_v_blocks_faq" CASCADE;
  DROP TABLE "jomiez_site"."_pages_v_blocks_cta" CASCADE;
  DROP TABLE "jomiez_site"."_pages_v_blocks_tenets" CASCADE;
  DROP TABLE "jomiez_site"."_pages_v_blocks_pricing" CASCADE;
  DROP TABLE "jomiez_site"."_pages_v" CASCADE;
  DROP TABLE "jomiez_site"."_pages_v_rels" CASCADE;
  DROP TABLE "jomiez_site"."projects_services" CASCADE;
  DROP TABLE "jomiez_site"."projects_stats" CASCADE;
  DROP TABLE "jomiez_site"."projects_sections_points" CASCADE;
  DROP TABLE "jomiez_site"."projects_sections" CASCADE;
  DROP TABLE "jomiez_site"."projects_product_page_stats" CASCADE;
  DROP TABLE "jomiez_site"."projects_product_page_cards" CASCADE;
  DROP TABLE "jomiez_site"."projects_product_page_system_features" CASCADE;
  DROP TABLE "jomiez_site"."projects_product_page_faq_items" CASCADE;
  DROP TABLE "jomiez_site"."projects" CASCADE;
  DROP TABLE "jomiez_site"."_projects_v_version_services" CASCADE;
  DROP TABLE "jomiez_site"."_projects_v_version_stats" CASCADE;
  DROP TABLE "jomiez_site"."_projects_v_version_sections_points" CASCADE;
  DROP TABLE "jomiez_site"."_projects_v_version_sections" CASCADE;
  DROP TABLE "jomiez_site"."_projects_v_version_product_page_stats" CASCADE;
  DROP TABLE "jomiez_site"."_projects_v_version_product_page_cards" CASCADE;
  DROP TABLE "jomiez_site"."_projects_v_version_product_page_system_features" CASCADE;
  DROP TABLE "jomiez_site"."_projects_v_version_product_page_faq_items" CASCADE;
  DROP TABLE "jomiez_site"."_projects_v" CASCADE;
  DROP TABLE "jomiez_site"."articles" CASCADE;
  DROP TABLE "jomiez_site"."_articles_v" CASCADE;
  DROP TABLE "jomiez_site"."media" CASCADE;
  DROP TABLE "jomiez_site"."users_roles" CASCADE;
  DROP TABLE "jomiez_site"."users_sessions" CASCADE;
  DROP TABLE "jomiez_site"."users" CASCADE;
  DROP TABLE "jomiez_site"."redirects" CASCADE;
  DROP TABLE "jomiez_site"."redirects_rels" CASCADE;
  DROP TABLE "jomiez_site"."payload_kv" CASCADE;
  DROP TABLE "jomiez_site"."payload_locked_documents" CASCADE;
  DROP TABLE "jomiez_site"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "jomiez_site"."payload_preferences" CASCADE;
  DROP TABLE "jomiez_site"."payload_preferences_rels" CASCADE;
  DROP TABLE "jomiez_site"."payload_migrations" CASCADE;
  DROP TABLE "jomiez_site"."home_services_items" CASCADE;
  DROP TABLE "jomiez_site"."home_mission_features" CASCADE;
  DROP TABLE "jomiez_site"."home_tenets_items" CASCADE;
  DROP TABLE "jomiez_site"."home_process_steps" CASCADE;
  DROP TABLE "jomiez_site"."home_studio_disciplines" CASCADE;
  DROP TABLE "jomiez_site"."home_pricing_tiers_features" CASCADE;
  DROP TABLE "jomiez_site"."home_pricing_tiers" CASCADE;
  DROP TABLE "jomiez_site"."home_faq_items" CASCADE;
  DROP TABLE "jomiez_site"."home" CASCADE;
  DROP TABLE "jomiez_site"."home_rels" CASCADE;
  DROP TABLE "jomiez_site"."_home_v_version_services_items" CASCADE;
  DROP TABLE "jomiez_site"."_home_v_version_mission_features" CASCADE;
  DROP TABLE "jomiez_site"."_home_v_version_tenets_items" CASCADE;
  DROP TABLE "jomiez_site"."_home_v_version_process_steps" CASCADE;
  DROP TABLE "jomiez_site"."_home_v_version_studio_disciplines" CASCADE;
  DROP TABLE "jomiez_site"."_home_v_version_pricing_tiers_features" CASCADE;
  DROP TABLE "jomiez_site"."_home_v_version_pricing_tiers" CASCADE;
  DROP TABLE "jomiez_site"."_home_v_version_faq_items" CASCADE;
  DROP TABLE "jomiez_site"."_home_v" CASCADE;
  DROP TABLE "jomiez_site"."_home_v_rels" CASCADE;
  DROP TABLE "jomiez_site"."about_mosaic" CASCADE;
  DROP TABLE "jomiez_site"."about_story_paragraphs" CASCADE;
  DROP TABLE "jomiez_site"."about_crafts_cards" CASCADE;
  DROP TABLE "jomiez_site"."about" CASCADE;
  DROP TABLE "jomiez_site"."_about_v_version_mosaic" CASCADE;
  DROP TABLE "jomiez_site"."_about_v_version_story_paragraphs" CASCADE;
  DROP TABLE "jomiez_site"."_about_v_version_crafts_cards" CASCADE;
  DROP TABLE "jomiez_site"."_about_v" CASCADE;
  DROP TABLE "jomiez_site"."services_page_list_items" CASCADE;
  DROP TABLE "jomiez_site"."services_page" CASCADE;
  DROP TABLE "jomiez_site"."_services_page_v_version_list_items" CASCADE;
  DROP TABLE "jomiez_site"."_services_page_v" CASCADE;
  DROP TABLE "jomiez_site"."work_page" CASCADE;
  DROP TABLE "jomiez_site"."_work_page_v" CASCADE;
  DROP TABLE "jomiez_site"."journal_page" CASCADE;
  DROP TABLE "jomiez_site"."_journal_page_v" CASCADE;
  DROP TABLE "jomiez_site"."contact_page_split_form_budgets" CASCADE;
  DROP TABLE "jomiez_site"."contact_page" CASCADE;
  DROP TABLE "jomiez_site"."_contact_page_v_version_split_form_budgets" CASCADE;
  DROP TABLE "jomiez_site"."_contact_page_v" CASCADE;
  DROP TABLE "jomiez_site"."navigation_header_links" CASCADE;
  DROP TABLE "jomiez_site"."navigation_footer_columns_links" CASCADE;
  DROP TABLE "jomiez_site"."navigation_footer_columns" CASCADE;
  DROP TABLE "jomiez_site"."navigation" CASCADE;
  DROP TABLE "jomiez_site"."_navigation_v_version_header_links" CASCADE;
  DROP TABLE "jomiez_site"."_navigation_v_version_footer_columns_links" CASCADE;
  DROP TABLE "jomiez_site"."_navigation_v_version_footer_columns" CASCADE;
  DROP TABLE "jomiez_site"."_navigation_v" CASCADE;
  DROP TABLE "jomiez_site"."site_stats" CASCADE;
  DROP TABLE "jomiez_site"."site_stack" CASCADE;
  DROP TABLE "jomiez_site"."site_socials" CASCADE;
  DROP TABLE "jomiez_site"."site" CASCADE;
  DROP TABLE "jomiez_site"."site_rels" CASCADE;
  DROP TABLE "jomiez_site"."_site_v_version_stats" CASCADE;
  DROP TABLE "jomiez_site"."_site_v_version_stack" CASCADE;
  DROP TABLE "jomiez_site"."_site_v_version_socials" CASCADE;
  DROP TABLE "jomiez_site"."_site_v" CASCADE;
  DROP TABLE "jomiez_site"."_site_v_rels" CASCADE;
  DROP TABLE "jomiez_site"."effects" CASCADE;
  DROP TABLE "jomiez_site"."_effects_v" CASCADE;
  DROP TABLE "jomiez_site"."not_found" CASCADE;
  DROP TABLE "jomiez_site"."_not_found_v" CASCADE;
  DROP TABLE "jomiez_site"."privacy_sections_items" CASCADE;
  DROP TABLE "jomiez_site"."privacy_sections" CASCADE;
  DROP TABLE "jomiez_site"."privacy" CASCADE;
  DROP TABLE "jomiez_site"."_privacy_v_version_sections_items" CASCADE;
  DROP TABLE "jomiez_site"."_privacy_v_version_sections" CASCADE;
  DROP TABLE "jomiez_site"."_privacy_v" CASCADE;
  DROP TABLE "jomiez_site"."terms_sections_items" CASCADE;
  DROP TABLE "jomiez_site"."terms_sections" CASCADE;
  DROP TABLE "jomiez_site"."terms" CASCADE;
  DROP TABLE "jomiez_site"."_terms_v_version_sections_items" CASCADE;
  DROP TABLE "jomiez_site"."_terms_v_version_sections" CASCADE;
  DROP TABLE "jomiez_site"."_terms_v" CASCADE;
  DROP TABLE "jomiez_site"."agent" CASCADE;
  DROP TYPE "jomiez_site"."enum_inquiries_status";
  DROP TYPE "jomiez_site"."enum_agent_threads_source";
  DROP TYPE "jomiez_site"."enum_agent_threads_status";
  DROP TYPE "jomiez_site"."enum_agent_routines_schedule";
  DROP TYPE "jomiez_site"."enum_agent_routines_weekday";
  DROP TYPE "jomiez_site"."enum_agent_routines_mode";
  DROP TYPE "jomiez_site"."enum_agent_memory_kind";
  DROP TYPE "jomiez_site"."enum_agent_memory_source";
  DROP TYPE "jomiez_site"."enum_pages_status";
  DROP TYPE "jomiez_site"."enum__pages_v_version_status";
  DROP TYPE "jomiez_site"."enum_projects_product_page_cards_mock";
  DROP TYPE "jomiez_site"."enum_projects_product_page_system_features_icon";
  DROP TYPE "jomiez_site"."enum_projects_status";
  DROP TYPE "jomiez_site"."enum__projects_v_version_product_page_cards_mock";
  DROP TYPE "jomiez_site"."enum__projects_v_version_product_page_system_features_icon";
  DROP TYPE "jomiez_site"."enum__projects_v_version_status";
  DROP TYPE "jomiez_site"."enum_articles_status";
  DROP TYPE "jomiez_site"."enum__articles_v_version_status";
  DROP TYPE "jomiez_site"."enum_users_roles";
  DROP TYPE "jomiez_site"."enum_redirects_to_type";
  DROP TYPE "jomiez_site"."enum_redirects_type";
  DROP TYPE "jomiez_site"."enum_home_status";
  DROP TYPE "jomiez_site"."enum__home_v_version_status";
  DROP TYPE "jomiez_site"."enum_about_crafts_cards_shape";
  DROP TYPE "jomiez_site"."enum_about_status";
  DROP TYPE "jomiez_site"."enum__about_v_version_crafts_cards_shape";
  DROP TYPE "jomiez_site"."enum__about_v_version_status";
  DROP TYPE "jomiez_site"."enum_services_page_status";
  DROP TYPE "jomiez_site"."enum__services_page_v_version_status";
  DROP TYPE "jomiez_site"."enum_work_page_status";
  DROP TYPE "jomiez_site"."enum__work_page_v_version_status";
  DROP TYPE "jomiez_site"."enum_journal_page_status";
  DROP TYPE "jomiez_site"."enum__journal_page_v_version_status";
  DROP TYPE "jomiez_site"."enum_contact_page_status";
  DROP TYPE "jomiez_site"."enum__contact_page_v_version_status";
  DROP TYPE "jomiez_site"."enum_navigation_status";
  DROP TYPE "jomiez_site"."enum__navigation_v_version_status";
  DROP TYPE "jomiez_site"."enum_site_socials_icon";
  DROP TYPE "jomiez_site"."enum__site_v_version_socials_icon";
  DROP TYPE "jomiez_site"."enum_not_found_status";
  DROP TYPE "jomiez_site"."enum__not_found_v_version_status";
  DROP TYPE "jomiez_site"."enum_privacy_status";
  DROP TYPE "jomiez_site"."enum__privacy_v_version_status";
  DROP TYPE "jomiez_site"."enum_terms_status";
  DROP TYPE "jomiez_site"."enum__terms_v_version_status";
  DROP TYPE "jomiez_site"."enum_agent_provider";
  DROP TYPE "jomiez_site"."enum_agent_thinking";
  DROP TYPE "jomiez_site"."enum_agent_mode";
  DROP TYPE "jomiez_site"."enum_agent_deletes";
  DROP TYPE "jomiez_site"."enum_agent_email";`)
}
