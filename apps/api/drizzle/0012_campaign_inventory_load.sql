ALTER TABLE "items" ADD COLUMN "space" integer NOT NULL DEFAULT 0;--> statement-breakpoint
UPDATE "items"
SET "space" = CASE
  WHEN jsonb_typeof("data"->'space') = 'number'
    AND ("data"->>'space') ~ '^[0-9]+$'
    AND ("data"->>'space')::integer BETWEEN 0 AND 9999
  THEN ("data"->>'space')::integer
  ELSE 0
END,
"data" = "data" - 'space';--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_space_non_negative" CHECK ("space" >= 0);--> statement-breakpoint

ALTER TABLE "character_inventory" RENAME COLUMN "notes" TO "gm_notes";--> statement-breakpoint
ALTER TABLE "character_inventory" ADD COLUMN "visible_notes" text;--> statement-breakpoint
ALTER TABLE "character_inventory" ADD COLUMN "space_per_unit" integer NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "character_inventory" ADD COLUMN "updated_at" timestamp with time zone NOT NULL DEFAULT now();--> statement-breakpoint
UPDATE "character_inventory" AS inventory
SET "space_per_unit" = item."space"
FROM "items" AS item
WHERE inventory."item_id" = item."id";--> statement-breakpoint
ALTER TABLE "character_inventory" ADD CONSTRAINT "character_inventory_quantity_positive" CHECK ("quantity" > 0);--> statement-breakpoint
ALTER TABLE "character_inventory" ADD CONSTRAINT "character_inventory_space_per_unit_non_negative" CHECK ("space_per_unit" >= 0);
