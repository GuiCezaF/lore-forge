CREATE TABLE "character_edit_drafts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "character_id" uuid NOT NULL,
  "ruleset_version" text NOT NULL,
  "name" text NOT NULL,
  "sheet_label" text,
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
  "nex" integer NOT NULL,
  "agility" integer NOT NULL,
  "strength" integer NOT NULL,
  "intellect" integer NOT NULL,
  "presence" integer NOT NULL,
  "vigor" integer NOT NULL,
  "image_asset_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "character_edit_drafts_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE cascade,
  CONSTRAINT "character_edit_drafts_ruleset_version_rulesets_version_fk" FOREIGN KEY ("ruleset_version") REFERENCES "rulesets"("version"),
  CONSTRAINT "character_edit_drafts_image_asset_id_media_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "media_assets"("id") ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX "character_edit_drafts_character_id_unique" ON "character_edit_drafts" USING btree ("character_id");
--> statement-breakpoint
CREATE TABLE "character_edit_draft_skills" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "draft_id" uuid NOT NULL,
  "name" text NOT NULL,
  "degree" text DEFAULT 'trained' NOT NULL,
  CONSTRAINT "character_edit_draft_skills_draft_id_character_edit_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "character_edit_drafts"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX "character_edit_draft_skills_draft_id_idx" ON "character_edit_draft_skills" USING btree ("draft_id");
--> statement-breakpoint
CREATE TABLE "character_edit_draft_powers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "draft_id" uuid NOT NULL,
  "name" text NOT NULL,
  "rank" integer DEFAULT 1 NOT NULL,
  CONSTRAINT "character_edit_draft_powers_draft_id_character_edit_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "character_edit_drafts"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX "character_edit_draft_powers_draft_id_idx" ON "character_edit_draft_powers" USING btree ("draft_id");
