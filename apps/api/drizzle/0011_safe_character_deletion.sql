-- Preserve the historical invariant for rows created before the lifecycle migration.
UPDATE "characters"
SET "campaign_attached_at" = COALESCE("campaign_attached_at", "updated_at", "created_at", now())
WHERE "campaign_id" IS NOT NULL AND "campaign_attached_at" IS NULL;--> statement-breakpoint

ALTER TABLE "characters"
  ADD CONSTRAINT "characters_campaign_attachment_timestamp_required"
  CHECK ("campaign_id" IS NULL OR "campaign_attached_at" IS NOT NULL);--> statement-breakpoint

CREATE OR REPLACE FUNCTION prevent_attached_character_deletion() RETURNS trigger AS $$
BEGIN
  IF OLD."campaign_id" IS NOT NULL OR OLD."campaign_attached_at" IS NOT NULL THEN
    RAISE EXCEPTION 'attached characters cannot be deleted';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

CREATE TRIGGER characters_prevent_attached_deletion
BEFORE DELETE ON "characters"
FOR EACH ROW EXECUTE FUNCTION prevent_attached_character_deletion();--> statement-breakpoint

UPDATE "characters" source
SET "source_character_id" = NULL
WHERE "source_character_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "characters" original WHERE original."id" = source."source_character_id"
  );--> statement-breakpoint

ALTER TABLE "characters"
  ADD CONSTRAINT "characters_source_character_id_characters_id_fk"
  FOREIGN KEY ("source_character_id") REFERENCES "characters"("id") ON DELETE SET NULL;
