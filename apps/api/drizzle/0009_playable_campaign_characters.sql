CREATE TABLE "campaign_character_rituals" (
  "character_id" uuid NOT NULL REFERENCES "characters"("id") ON DELETE cascade,
  "ritual_slug" text NOT NULL,
  "rank" integer NOT NULL,
  CONSTRAINT "campaign_character_rituals_character_id_ritual_slug_pk"
    PRIMARY KEY ("character_id", "ritual_slug")
);--> statement-breakpoint

UPDATE "campaign_character_states"
SET
  "current_hp" = GREATEST("current_hp", 0),
  "current_san" = GREATEST("current_san", 0),
  "current_ep" = GREATEST("current_ep", 0);--> statement-breakpoint

ALTER TABLE "campaign_character_states"
  ADD CONSTRAINT "campaign_character_states_current_hp_non_negative"
    CHECK ("current_hp" >= 0),
  ADD CONSTRAINT "campaign_character_states_current_san_non_negative"
    CHECK ("current_san" >= 0),
  ADD CONSTRAINT "campaign_character_states_current_ep_non_negative"
    CHECK ("current_ep" >= 0);--> statement-breakpoint

INSERT INTO "campaign_character_states" (
  "character_id", "current_hp", "current_san", "current_ep"
)
SELECT
  "characters"."id",
  COALESCE("characters"."max_hp", 0),
  COALESCE("characters"."max_san", 0),
  COALESCE("characters"."max_ep", 0)
FROM "characters"
LEFT JOIN "campaign_character_states"
  ON "campaign_character_states"."character_id" = "characters"."id"
WHERE "characters"."kind" = 'pc'
  AND "characters"."campaign_id" IS NOT NULL
  AND "campaign_character_states"."character_id" IS NULL;--> statement-breakpoint

INSERT INTO "campaign_character_states" (
  "character_id", "current_hp", "current_san", "current_ep"
)
SELECT
  "characters"."id",
  COALESCE("npc_stat_blocks"."hp", 0),
  0,
  0
FROM "characters"
LEFT JOIN "npc_stat_blocks"
  ON "npc_stat_blocks"."character_id" = "characters"."id"
LEFT JOIN "campaign_character_states"
  ON "campaign_character_states"."character_id" = "characters"."id"
WHERE "characters"."kind" = 'npc'
  AND "characters"."npc_mode" = 'threat'
  AND "characters"."campaign_id" IS NOT NULL
  AND "campaign_character_states"."character_id" IS NULL;--> statement-breakpoint
