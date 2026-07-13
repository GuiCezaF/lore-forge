CREATE TABLE "rule_class_skill_choices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"group_slug" text NOT NULL,
	"skill_slug" text NOT NULL,
	"selection_count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rule_class_skill_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"skill_slug" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rule_origin_skill_choices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"origin_id" uuid NOT NULL,
	"group_slug" text NOT NULL,
	"skill_slug" text NOT NULL,
	"selection_count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rule_origin_skill_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"origin_id" uuid NOT NULL,
	"skill_slug" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rule_class_skill_choices" ADD CONSTRAINT "rule_class_skill_choices_class_id_rule_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."rule_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_class_skill_grants" ADD CONSTRAINT "rule_class_skill_grants_class_id_rule_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."rule_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_origin_skill_choices" ADD CONSTRAINT "rule_origin_skill_choices_origin_id_rule_origins_id_fk" FOREIGN KEY ("origin_id") REFERENCES "public"."rule_origins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_origin_skill_grants" ADD CONSTRAINT "rule_origin_skill_grants_origin_id_rule_origins_id_fk" FOREIGN KEY ("origin_id") REFERENCES "public"."rule_origins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rule_class_skill_choices_class_group_skill_unique" ON "rule_class_skill_choices" USING btree ("class_id","group_slug","skill_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "rule_class_skill_grants_class_skill_unique" ON "rule_class_skill_grants" USING btree ("class_id","skill_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "rule_origin_skill_choices_origin_group_skill_unique" ON "rule_origin_skill_choices" USING btree ("origin_id","group_slug","skill_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "rule_origin_skill_grants_origin_skill_unique" ON "rule_origin_skill_grants" USING btree ("origin_id","skill_slug");
--> statement-breakpoint
INSERT INTO "rule_class_skill_grants" ("class_id", "skill_slug")
SELECT c.id, v.skill_slug
FROM "rule_classes" c
JOIN (VALUES
  ('ocultista', 'ocultismo'),
  ('ocultista', 'vontade')
) AS v(class_slug, skill_slug) ON v.class_slug = c.slug
WHERE c.ruleset_version = 'op-rpg-1.3';
--> statement-breakpoint
INSERT INTO "rule_class_skill_choices" ("class_id", "group_slug", "skill_slug", "selection_count")
SELECT c.id, v.group_slug, v.skill_slug, v.selection_count
FROM "rule_classes" c
JOIN (VALUES
  ('combatente', 'combate-armado', 'luta', 1),
  ('combatente', 'combate-armado', 'pontaria', 1),
  ('combatente', 'defesa-fisica', 'fortitude', 1),
  ('combatente', 'defesa-fisica', 'reflexos', 1)
) AS v(class_slug, group_slug, skill_slug, selection_count) ON v.class_slug = c.slug
WHERE c.ruleset_version = 'op-rpg-1.3';
--> statement-breakpoint
INSERT INTO "rule_origin_skill_grants" ("origin_id", "skill_slug")
SELECT o.id, v.skill_slug
FROM "rule_origins" o
JOIN (VALUES
  ('academico', 'ciencia'), ('academico', 'investigacao'),
  ('agente-de-saude', 'intuicao'), ('agente-de-saude', 'medicina'),
  ('artista', 'artes'), ('artista', 'enganacao'),
  ('atleta', 'acrobacia'), ('atleta', 'atletismo'),
  ('chef', 'fortitude'), ('chef', 'profissao'),
  ('criminoso', 'crime'), ('criminoso', 'furtividade'),
  ('cultista-arrependido', 'ocultismo'), ('cultista-arrependido', 'religiao'),
  ('desgarrado', 'fortitude'), ('desgarrado', 'sobrevivencia'),
  ('engenheiro', 'profissao'), ('engenheiro', 'tecnologia'),
  ('executivo', 'diplomacia'), ('executivo', 'profissao'),
  ('ludico', 'artes'), ('ludico', 'enganacao'),
  ('magnata', 'diplomacia'), ('magnata', 'pilotagem'),
  ('mercenario', 'iniciativa'), ('mercenario', 'intimidacao'),
  ('militar', 'pontaria'), ('militar', 'tatica'),
  ('operario', 'fortitude'), ('operario', 'profissao'),
  ('policial', 'percepcao'), ('policial', 'pontaria'),
  ('religioso', 'religiao'), ('religioso', 'vontade'),
  ('servidor-publico', 'intuicao'), ('servidor-publico', 'vontade'),
  ('teorico-da-conspiracao', 'investigacao'), ('teorico-da-conspiracao', 'ocultismo'),
  ('ti', 'investigacao'), ('ti', 'tecnologia'),
  ('trabalhador-rural', 'adestramento'), ('trabalhador-rural', 'sobrevivencia'),
  ('trambiqueiro', 'crime'), ('trambiqueiro', 'enganacao'),
  ('universitario', 'atualidades'), ('universitario', 'investigacao'),
  ('vitima', 'reflexos'), ('vitima', 'vontade')
) AS v(origin_slug, skill_slug) ON v.origin_slug = o.slug
WHERE o.ruleset_version = 'op-rpg-1.3';
--> statement-breakpoint
INSERT INTO "rule_origin_skill_choices" ("origin_id", "group_slug", "skill_slug", "selection_count")
SELECT o.id, 'memorias-fragmentadas', s.slug, 2
FROM "rule_origins" o
JOIN "rule_skills" s ON s.ruleset_version = o.ruleset_version
WHERE o.ruleset_version = 'op-rpg-1.3'
  AND o.slug = 'amnesico';
