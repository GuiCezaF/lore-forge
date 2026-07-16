-- This deliberately destroys legacy NPC templates and their dependent rows.
DELETE FROM "characters" WHERE "kind" = 'npc';
ALTER TABLE "characters" DROP COLUMN "sheet_label";
ALTER TABLE "character_edit_drafts" DROP COLUMN "sheet_label";
