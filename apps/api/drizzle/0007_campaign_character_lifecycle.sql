ALTER TABLE "characters" ADD COLUMN "campaign_attached_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "status_changed_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "archive_reason" text;--> statement-breakpoint
ALTER TABLE "characters" DROP CONSTRAINT "characters_campaign_id_campaigns_id_fk";--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_campaign_id_campaigns_id_fk"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT;
ALTER TABLE "characters" ADD CONSTRAINT "characters_attached_campaign_required"
  CHECK ("campaign_attached_at" IS NULL OR "campaign_id" IS NOT NULL);--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_character_campaign_reassignment() RETURNS trigger AS $$
BEGIN
  IF OLD."campaign_attached_at" IS NOT NULL AND NEW."campaign_id" IS DISTINCT FROM OLD."campaign_id" THEN
    RAISE EXCEPTION 'campaign_id cannot change after attachment';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER characters_campaign_attachment_immutable
BEFORE UPDATE OF "campaign_id" ON "characters"
FOR EACH ROW EXECUTE FUNCTION prevent_character_campaign_reassignment();

-- A bound sheet can never become reusable. Existing attached active sheets
-- retain their attachment time; legacy duplicates are historical records.
UPDATE "characters"
SET "campaign_attached_at" = COALESCE("campaign_attached_at", "updated_at", "created_at"),
    "status_changed_at" = COALESCE("status_changed_at", "updated_at", "created_at")
WHERE "campaign_id" IS NOT NULL;--> statement-breakpoint

WITH ranked AS (
  SELECT "id", row_number() OVER (
    PARTITION BY "campaign_id", "owner_user_id"
    ORDER BY "updated_at" DESC, "created_at" DESC, "id" DESC
  ) AS position
  FROM "characters"
  WHERE "kind" = 'pc' AND "status" = 'active' AND "campaign_id" IS NOT NULL
)
UPDATE "characters" character
SET "status" = 'archived',
    "archive_reason" = 'replaced',
    "frozen_at" = now(),
    "status_changed_at" = now(),
    "updated_at" = now()
FROM ranked
WHERE character."id" = ranked."id" AND ranked.position > 1;--> statement-breakpoint

CREATE UNIQUE INDEX "characters_active_campaign_player_unique"
ON "characters" ("campaign_id", "owner_user_id")
WHERE "status" = 'active' AND "kind" = 'pc' AND "deleted_at" IS NULL;
