ALTER TABLE "rule_classes" ADD COLUMN "san_per_nex" integer;--> statement-breakpoint
ALTER TABLE "rule_classes" ADD COLUMN "training_upgrade_base" integer;--> statement-breakpoint
UPDATE "rule_classes"
SET
  "san_per_nex" = CASE "slug"
    WHEN 'combatente' THEN 3
    WHEN 'especialista' THEN 4
    WHEN 'ocultista' THEN 5
  END,
  "training_upgrade_base" = CASE "slug"
    WHEN 'combatente' THEN 2
    WHEN 'especialista' THEN 5
    WHEN 'ocultista' THEN 3
  END
WHERE "ruleset_version" = 'op-rpg-1.3';--> statement-breakpoint
ALTER TABLE "rule_classes" ALTER COLUMN "san_per_nex" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rule_classes" ALTER COLUMN "training_upgrade_base" SET NOT NULL;
