-- A campaign owner is the only GM. Legacy GM rows (except the owner) become
-- players; spectators have no identified campaign membership.
DELETE FROM "campaign_members" member
USING "campaigns" campaign
WHERE member."campaign_id" = campaign."id"
  AND (member."user_id" = campaign."owner_user_id" OR member."role" = 'spectator');--> statement-breakpoint

UPDATE "campaign_members" SET "role" = 'player' WHERE "role" <> 'player';--> statement-breakpoint

-- Retain the oldest nine members for each campaign and archive the removed
-- players' campaign sheets before deleting their memberships.
WITH ranked AS (
  SELECT "campaign_id", "user_id", row_number() OVER (
    PARTITION BY "campaign_id" ORDER BY "joined_at", "user_id"
  ) AS position
  FROM "campaign_members"
), removed AS (
  SELECT "campaign_id", "user_id" FROM ranked WHERE position > 9
)
UPDATE "characters" character SET "status" = 'archived', "frozen_at" = now(), "updated_at" = now()
FROM removed
WHERE character."campaign_id" = removed."campaign_id"
  AND character."owner_user_id" = removed."user_id"
  AND character."kind" = 'pc';--> statement-breakpoint

WITH ranked AS (
  SELECT "campaign_id", "user_id", row_number() OVER (
    PARTITION BY "campaign_id" ORDER BY "joined_at", "user_id"
  ) AS position
  FROM "campaign_members"
)
DELETE FROM "campaign_members" member USING ranked
WHERE member."campaign_id" = ranked."campaign_id"
  AND member."user_id" = ranked."user_id" AND ranked.position > 9;--> statement-breakpoint

UPDATE "campaign_invitations" invitation
SET "status" = 'expired', "resolved_at" = now()
WHERE invitation."status" = 'pending' AND invitation."expires_at" <= now();--> statement-breakpoint

UPDATE "campaign_invitations" invitation
SET "status" = 'cancelled', "resolved_at" = now()
FROM "campaigns" campaign
WHERE invitation."campaign_id" = campaign."id" AND invitation."status" = 'pending'
  AND (invitation."invited_user_id" = campaign."owner_user_id" OR EXISTS (
    SELECT 1 FROM "campaign_members" member
    WHERE member."campaign_id" = invitation."campaign_id"
      AND member."user_id" = invitation."invited_user_id"
  ));--> statement-breakpoint

WITH ranked AS (
  SELECT id, row_number() OVER (
    PARTITION BY "campaign_id", "invited_user_id" ORDER BY "created_at", id
  ) AS position
  FROM "campaign_invitations" WHERE "status" = 'pending'
)
UPDATE "campaign_invitations" invitation SET "status" = 'cancelled', "resolved_at" = now()
FROM ranked WHERE invitation.id = ranked.id AND ranked.position > 1;--> statement-breakpoint

WITH ranked AS (
  SELECT invitation.id, row_number() OVER (
    PARTITION BY invitation."campaign_id" ORDER BY invitation."created_at", invitation.id
  ) AS position,
  (SELECT count(*) FROM "campaign_members" member WHERE member."campaign_id" = invitation."campaign_id") AS member_count
  FROM "campaign_invitations" invitation WHERE invitation."status" = 'pending'
)
UPDATE "campaign_invitations" invitation SET "status" = 'cancelled', "resolved_at" = now()
FROM ranked WHERE invitation.id = ranked.id AND ranked.position > GREATEST(9 - ranked.member_count, 0);--> statement-breakpoint

ALTER TABLE "campaign_members" DROP COLUMN "role";--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_invitations_pending_campaign_user_unique" ON "campaign_invitations" ("campaign_id", "invited_user_id") WHERE "status" = 'pending';--> statement-breakpoint
CREATE INDEX "campaign_invitations_pending_capacity_idx" ON "campaign_invitations" ("campaign_id") WHERE "status" = 'pending';
