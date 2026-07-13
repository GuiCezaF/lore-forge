CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"user_agent" text,
	"ip_address" "inet"
);
--> statement-breakpoint
CREATE TABLE "campaign_character_states" (
	"character_id" uuid PRIMARY KEY NOT NULL,
	"current_hp" integer DEFAULT 0 NOT NULL,
	"current_san" integer DEFAULT 0 NOT NULL,
	"current_ep" integer DEFAULT 0 NOT NULL,
	"conditions" text DEFAULT '' NOT NULL,
	"temporary_effects" text DEFAULT '' NOT NULL,
	"gm_notes" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"invited_user_id" uuid NOT NULL,
	"invited_by_user_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "campaign_members" (
	"campaign_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'player' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_members_campaign_id_user_id_pk" PRIMARY KEY("campaign_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"cover_image_asset_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"item_id" uuid,
	"name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"is_equipped" boolean DEFAULT false NOT NULL,
	"notes" text,
	"added_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_selections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"category" text NOT NULL,
	"name" text NOT NULL,
	"rank" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"name" text NOT NULL,
	"degree" text DEFAULT 'trained' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid,
	"owner_user_id" uuid,
	"source_character_id" uuid,
	"kind" text DEFAULT 'pc' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"npc_mode" text,
	"sheet_label" text,
	"ruleset_version" text DEFAULT 'op-rpg-1.3' NOT NULL,
	"name" text NOT NULL,
	"concept" text,
	"gender" text,
	"age" integer,
	"appearance" text,
	"personality" text,
	"history" text,
	"objective" text,
	"player_notes" text,
	"origin" text,
	"character_class" text,
	"path" text,
	"nex" integer DEFAULT 5 NOT NULL,
	"agility" integer DEFAULT 1 NOT NULL,
	"strength" integer DEFAULT 1 NOT NULL,
	"intellect" integer DEFAULT 1 NOT NULL,
	"presence" integer DEFAULT 1 NOT NULL,
	"vigor" integer DEFAULT 1 NOT NULL,
	"max_hp" integer,
	"max_san" integer,
	"max_ep" integer,
	"ep_limit" integer,
	"defense" integer,
	"dodge" integer,
	"block" integer,
	"movement" integer,
	"carry_capacity" integer,
	"image_asset_id" uuid,
	"frozen_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid,
	"campaign_id" uuid,
	"source_item_id" uuid,
	"scope" text DEFAULT 'system' NOT NULL,
	"kind" text DEFAULT 'item' NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"image_asset_id" uuid,
	"locked" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid,
	"campaign_id" uuid,
	"bucket" text NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"kind" text DEFAULT 'image' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "monsters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid,
	"campaign_id" uuid,
	"source_monster_id" uuid,
	"scope" text DEFAULT 'system' NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"image_asset_id" uuid,
	"locked" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "npc_abilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"action_cost" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "npc_attacks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"name" text NOT NULL,
	"test" text,
	"damage" text,
	"range" text,
	"critical" text,
	"effect" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "npc_resistances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"damage_type" text NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"kind" text DEFAULT 'resistance' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "npc_stat_blocks" (
	"character_id" uuid PRIMARY KEY NOT NULL,
	"threat_level" integer DEFAULT 0 NOT NULL,
	"hp" integer DEFAULT 1 NOT NULL,
	"defense" integer DEFAULT 10 NOT NULL,
	"fortitude" integer DEFAULT 0 NOT NULL,
	"reflex" integer DEFAULT 0 NOT NULL,
	"will" integer DEFAULT 0 NOT NULL,
	"perception" integer DEFAULT 0 NOT NULL,
	"movement" integer DEFAULT 9 NOT NULL,
	"size" text DEFAULT 'medium' NOT NULL,
	"senses" text,
	"notes" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rule_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ruleset_version" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"base_hp" integer NOT NULL,
	"hp_per_nex" integer NOT NULL,
	"base_san" integer NOT NULL,
	"base_ep" integer NOT NULL,
	"trained_skills" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rule_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ruleset_version" text NOT NULL,
	"kind" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"min_nex" integer DEFAULT 5 NOT NULL,
	"max_rank" integer DEFAULT 1 NOT NULL,
	"required_class_slug" text
);
--> statement-breakpoint
CREATE TABLE "rule_origins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ruleset_version" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rule_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"min_nex" integer DEFAULT 10 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rule_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ruleset_version" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rulesets" (
	"version" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"min_nex" integer DEFAULT 5 NOT NULL,
	"max_nex" integer DEFAULT 99 NOT NULL,
	"nex_step" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text DEFAULT 'google' NOT NULL,
	"provider_subject" text NOT NULL,
	"email" text NOT NULL,
	"short_code" text NOT NULL,
	"name" text NOT NULL,
	"picture" text,
	"role" text DEFAULT 'user' NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	"token_version" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_character_states" ADD CONSTRAINT "campaign_character_states_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_invitations" ADD CONSTRAINT "campaign_invitations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_invitations" ADD CONSTRAINT "campaign_invitations_invited_user_id_users_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_invitations" ADD CONSTRAINT "campaign_invitations_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_cover_image_asset_id_media_assets_id_fk" FOREIGN KEY ("cover_image_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_inventory" ADD CONSTRAINT "character_inventory_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_inventory" ADD CONSTRAINT "character_inventory_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_inventory" ADD CONSTRAINT "character_inventory_added_by_user_id_users_id_fk" FOREIGN KEY ("added_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_selections" ADD CONSTRAINT "character_selections_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_skills" ADD CONSTRAINT "character_skills_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_ruleset_version_rulesets_version_fk" FOREIGN KEY ("ruleset_version") REFERENCES "public"."rulesets"("version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_image_asset_id_media_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_image_asset_id_media_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monsters" ADD CONSTRAINT "monsters_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monsters" ADD CONSTRAINT "monsters_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monsters" ADD CONSTRAINT "monsters_image_asset_id_media_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "npc_abilities" ADD CONSTRAINT "npc_abilities_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "npc_attacks" ADD CONSTRAINT "npc_attacks_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "npc_resistances" ADD CONSTRAINT "npc_resistances_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "npc_stat_blocks" ADD CONSTRAINT "npc_stat_blocks_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_classes" ADD CONSTRAINT "rule_classes_ruleset_version_rulesets_version_fk" FOREIGN KEY ("ruleset_version") REFERENCES "public"."rulesets"("version") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_options" ADD CONSTRAINT "rule_options_ruleset_version_rulesets_version_fk" FOREIGN KEY ("ruleset_version") REFERENCES "public"."rulesets"("version") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_origins" ADD CONSTRAINT "rule_origins_ruleset_version_rulesets_version_fk" FOREIGN KEY ("ruleset_version") REFERENCES "public"."rulesets"("version") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_paths" ADD CONSTRAINT "rule_paths_class_id_rule_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."rule_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_skills" ADD CONSTRAINT "rule_skills_ruleset_version_rulesets_version_fk" FOREIGN KEY ("ruleset_version") REFERENCES "public"."rulesets"("version") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_sessions_refresh_token_unique" ON "auth_sessions" USING btree ("refresh_token_hash");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "campaign_invitations_campaign_id_idx" ON "campaign_invitations" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_invitations_invited_user_id_idx" ON "campaign_invitations" USING btree ("invited_user_id");--> statement-breakpoint
CREATE INDEX "campaign_members_campaign_id_idx" ON "campaign_members" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_members_user_id_idx" ON "campaign_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "campaigns_owner_user_id_idx" ON "campaigns" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "campaigns_deleted_at_idx" ON "campaigns" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "character_inventory_character_id_idx" ON "character_inventory" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "character_selections_character_id_idx" ON "character_selections" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "character_skills_character_id_idx" ON "character_skills" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "characters_campaign_id_idx" ON "characters" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "characters_owner_user_id_idx" ON "characters" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "characters_source_character_id_idx" ON "characters" USING btree ("source_character_id");--> statement-breakpoint
CREATE INDEX "characters_frozen_at_idx" ON "characters" USING btree ("frozen_at");--> statement-breakpoint
CREATE INDEX "characters_deleted_at_idx" ON "characters" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "items_owner_user_id_idx" ON "items" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "items_campaign_id_idx" ON "items" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "items_scope_idx" ON "items" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "items_kind_idx" ON "items" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "items_deleted_at_idx" ON "items" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "media_assets_storage_key_unique" ON "media_assets" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "media_assets_owner_user_id_idx" ON "media_assets" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "media_assets_campaign_id_idx" ON "media_assets" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "monsters_owner_user_id_idx" ON "monsters" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "monsters_campaign_id_idx" ON "monsters" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "monsters_scope_idx" ON "monsters" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "monsters_deleted_at_idx" ON "monsters" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "npc_abilities_character_id_idx" ON "npc_abilities" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "npc_attacks_character_id_idx" ON "npc_attacks" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "npc_resistances_character_id_idx" ON "npc_resistances" USING btree ("character_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rule_classes_ruleset_slug_unique" ON "rule_classes" USING btree ("ruleset_version","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "rule_options_ruleset_kind_slug_unique" ON "rule_options" USING btree ("ruleset_version","kind","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "rule_origins_ruleset_slug_unique" ON "rule_origins" USING btree ("ruleset_version","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "rule_paths_class_slug_unique" ON "rule_paths" USING btree ("class_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "rule_skills_ruleset_slug_unique" ON "rule_skills" USING btree ("ruleset_version","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "users_provider_subject_unique" ON "users" USING btree ("provider_subject");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_short_code_unique" ON "users" USING btree ("short_code");--> statement-breakpoint
CREATE INDEX "users_deleted_at_idx" ON "users" USING btree ("deleted_at");