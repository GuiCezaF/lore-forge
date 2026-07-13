-- Ordem Paranormal RPG 1.3 is stored as versioned data, never as an
-- application enum. Future books or house rules can add a ruleset/version
-- without changing the character domain code.
INSERT INTO "rulesets" ("version", "name", "min_nex", "max_nex", "nex_step")
VALUES ('op-rpg-1.3', 'Ordem Paranormal RPG 1.3', 5, 99, 5)
ON CONFLICT ("version") DO NOTHING;

INSERT INTO "rule_classes" ("ruleset_version", "slug", "name", "base_hp", "hp_per_nex", "base_san", "base_ep", "trained_skills") VALUES
  ('op-rpg-1.3', 'combatente', 'Combatente', 20, 4, 12, 2, 1),
  ('op-rpg-1.3', 'especialista', 'Especialista', 16, 3, 16, 3, 7),
  ('op-rpg-1.3', 'ocultista', 'Ocultista', 12, 2, 20, 4, 3)
ON CONFLICT ("ruleset_version", "slug") DO NOTHING;

INSERT INTO "rule_paths" ("class_id", "slug", "name", "min_nex")
SELECT c.id, v.slug, v.name, 10
FROM "rule_classes" c
JOIN (VALUES
  ('combatente', 'aniquilador', 'Aniquilador'), ('combatente', 'comandante-de-campo', 'Comandante de Campo'), ('combatente', 'guerreiro', 'Guerreiro'),
  ('especialista', 'atirador-de-elite', 'Atirador de Elite'), ('especialista', 'infiltrador', 'Infiltrador'), ('especialista', 'medico-de-campo', 'Médico de Campo'), ('especialista', 'negociador', 'Negociador'), ('especialista', 'tecnico', 'Técnico'),
  ('ocultista', 'conduite', 'Conduíte'), ('ocultista', 'flagelador', 'Flagelador'), ('ocultista', 'graduado', 'Graduado'), ('ocultista', 'lamina-paranormal', 'Lâmina Paranormal')
) AS v(class_slug, slug, name) ON v.class_slug = c.slug
WHERE c.ruleset_version = 'op-rpg-1.3'
ON CONFLICT ("class_id", "slug") DO NOTHING;

INSERT INTO "rule_origins" ("ruleset_version", "slug", "name") VALUES
  ('op-rpg-1.3', 'academico', 'Acadêmico'), ('op-rpg-1.3', 'agente-de-saude', 'Agente de Saúde'), ('op-rpg-1.3', 'amnesico', 'Amnésico'), ('op-rpg-1.3', 'artista', 'Artista'),
  ('op-rpg-1.3', 'atleta', 'Atleta'), ('op-rpg-1.3', 'chef', 'Chef'), ('op-rpg-1.3', 'criminoso', 'Criminoso'), ('op-rpg-1.3', 'cultista-arrependido', 'Cultista Arrependido'),
  ('op-rpg-1.3', 'desgarrado', 'Desgarrado'), ('op-rpg-1.3', 'engenheiro', 'Engenheiro'), ('op-rpg-1.3', 'executivo', 'Executivo'), ('op-rpg-1.3', 'ludico', 'Lúdico'),
  ('op-rpg-1.3', 'magnata', 'Magnata'), ('op-rpg-1.3', 'mercenario', 'Mercenário'), ('op-rpg-1.3', 'militar', 'Militar'), ('op-rpg-1.3', 'operario', 'Operário'),
  ('op-rpg-1.3', 'policial', 'Policial'), ('op-rpg-1.3', 'religioso', 'Religioso'), ('op-rpg-1.3', 'servidor-publico', 'Servidor Público'), ('op-rpg-1.3', 'teorico-da-conspiracao', 'Teórico da Conspiração'), ('op-rpg-1.3', 'ti', 'T.I.'), ('op-rpg-1.3', 'trabalhador-rural', 'Trabalhador Rural'), ('op-rpg-1.3', 'trambiqueiro', 'Trambiqueiro'), ('op-rpg-1.3', 'universitario', 'Universitário'), ('op-rpg-1.3', 'vitima', 'Vítima')
ON CONFLICT ("ruleset_version", "slug") DO NOTHING;

INSERT INTO "rule_skills" ("ruleset_version", "slug", "name") VALUES
  ('op-rpg-1.3', 'acrobacia', 'Acrobacia'), ('op-rpg-1.3', 'adestramento', 'Adestramento'), ('op-rpg-1.3', 'artes', 'Artes'), ('op-rpg-1.3', 'atletismo', 'Atletismo'), ('op-rpg-1.3', 'atualidades', 'Atualidades'),
  ('op-rpg-1.3', 'ciencia', 'Ciência'), ('op-rpg-1.3', 'crime', 'Crime'), ('op-rpg-1.3', 'diplomacia', 'Diplomacia'), ('op-rpg-1.3', 'enganacao', 'Enganação'), ('op-rpg-1.3', 'fortitude', 'Fortitude'),
  ('op-rpg-1.3', 'furtividade', 'Furtividade'), ('op-rpg-1.3', 'iniciativa', 'Iniciativa'), ('op-rpg-1.3', 'intimidacao', 'Intimidação'), ('op-rpg-1.3', 'intuicao', 'Intuição'), ('op-rpg-1.3', 'investigacao', 'Investigação'),
  ('op-rpg-1.3', 'luta', 'Luta'), ('op-rpg-1.3', 'medicina', 'Medicina'), ('op-rpg-1.3', 'ocultismo', 'Ocultismo'), ('op-rpg-1.3', 'percepcao', 'Percepção'), ('op-rpg-1.3', 'pilotagem', 'Pilotagem'),
  ('op-rpg-1.3', 'pontaria', 'Pontaria'), ('op-rpg-1.3', 'profissao', 'Profissão'), ('op-rpg-1.3', 'reflexos', 'Reflexos'), ('op-rpg-1.3', 'religiao', 'Religião'), ('op-rpg-1.3', 'sobrevivencia', 'Sobrevivência'), ('op-rpg-1.3', 'tatica', 'Tática'), ('op-rpg-1.3', 'tecnologia', 'Tecnologia'), ('op-rpg-1.3', 'vontade', 'Vontade')
ON CONFLICT ("ruleset_version", "slug") DO NOTHING;

-- Powers and rituals have their availability encoded in records. `max_rank`
-- is the highest selectable ritual circle/rank; the engine rejects invalid
-- choices without having to know individual option names.
INSERT INTO "rule_options" ("ruleset_version", "kind", "slug", "name", "min_nex", "max_rank", "required_class_slug") VALUES
  ('op-rpg-1.3', 'power', 'afinidade-com-elemento', 'Afinidade com Elemento', 50, 1, NULL), ('op-rpg-1.3', 'power', 'afortunado', 'Afortunado', 5, 1, NULL), ('op-rpg-1.3', 'power', 'aparencia-inofensiva', 'Aparência Inofensiva', 5, 1, NULL),
  ('op-rpg-1.3', 'power', 'arma-de-sangue', 'Arma de Sangue', 5, 1, NULL), ('op-rpg-1.3', 'power', 'camuflar-ocultismo', 'Camuflar Ocultismo', 5, 1, NULL), ('op-rpg-1.3', 'power', 'casca-grossa', 'Casca Grossa', 5, 1, NULL),
  ('op-rpg-1.3', 'power', 'expansao-de-conhecimento', 'Expansão de Conhecimento', 5, 1, NULL), ('op-rpg-1.3', 'power', 'fluxo-de-poder', 'Fluxo de Poder', 5, 1, NULL), ('op-rpg-1.3', 'power', 'golpe-de-sorte', 'Golpe de Sorte', 5, 1, NULL),
  ('op-rpg-1.3', 'power', 'medo-tangivel', 'Medo Tangível', 50, 1, NULL), ('op-rpg-1.3', 'power', 'medicinal', 'Medicinal', 5, 1, NULL), ('op-rpg-1.3', 'power', 'sangue-de-ferro', 'Sangue de Ferro', 5, 1, NULL),
  ('op-rpg-1.3', 'power', 'sensitivo', 'Sensitivo', 5, 1, NULL), ('op-rpg-1.3', 'power', 'surto-temporal', 'Surto Temporal', 5, 1, NULL), ('op-rpg-1.3', 'power', 'tatuagem-ritualistica', 'Tatuagem Ritualística', 5, 1, NULL), ('op-rpg-1.3', 'power', 'treinamento-em-pericia', 'Treinamento em Perícia', 5, 1, NULL), ('op-rpg-1.3', 'power', 'vislumbres-do-outro-lado', 'Vislumbres do Outro Lado', 5, 1, NULL),
  ('op-rpg-1.3', 'power', 'ataque-de-oportunidade', 'Ataque de Oportunidade', 15, 1, 'combatente'), ('op-rpg-1.3', 'power', 'combate-defensivo', 'Combate Defensivo', 15, 1, 'combatente'), ('op-rpg-1.3', 'power', 'golpe-pesado', 'Golpe Pesado', 15, 1, 'combatente'), ('op-rpg-1.3', 'power', 'mestre-em-armas', 'Mestre em Armas', 45, 1, 'combatente'),
  ('op-rpg-1.3', 'power', 'balistica-avancada', 'Balística Avançada', 15, 1, 'especialista'), ('op-rpg-1.3', 'power', 'conhecimento-aplicado', 'Conhecimento Aplicado', 15, 1, 'especialista'), ('op-rpg-1.3', 'power', 'especialista-em-explosivos', 'Especialista em Explosivos', 30, 1, 'especialista'), ('op-rpg-1.3', 'power', 'perito', 'Perito', 15, 1, 'especialista'),
  ('op-rpg-1.3', 'power', 'canalizar-o-medo', 'Canalizar o Medo', 50, 1, 'ocultista'), ('op-rpg-1.3', 'power', 'especialista-em-rituais', 'Especialista em Rituais', 15, 1, 'ocultista'), ('op-rpg-1.3', 'power', 'mestre-ritualista', 'Mestre Ritualista', 45, 1, 'ocultista')
ON CONFLICT ("ruleset_version", "kind", "slug") DO NOTHING;

INSERT INTO "rule_options" ("ruleset_version", "kind", "slug", "name", "min_nex", "max_rank", "required_class_slug") VALUES
  ('op-rpg-1.3', 'ritual', 'amaldiçoar-arma', 'Amaldiçoar Arma', 5, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'amaldiçoar-tecnologia', 'Amaldiçoar Tecnologia', 5, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'arma-atroz', 'Arma Atroz', 5, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'cicatrizacao', 'Cicatrização', 5, 4, 'ocultista'),
  ('op-rpg-1.3', 'ritual', 'decadencia', 'Decadência', 5, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'definhar', 'Definhar', 5, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'detectar-ameacas', 'Detectar Ameaças', 5, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'eletrocussao', 'Eletrocussão', 5, 4, 'ocultista'),
  ('op-rpg-1.3', 'ritual', 'enfeitiçar', 'Enfeitiçar', 5, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'embaralhar', 'Embaralhar', 5, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'espirais-da-perdicao', 'Espirais da Perdição', 5, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'fortalecimento-sensorial', 'Fortalecimento Sensorial', 5, 4, 'ocultista'),
  ('op-rpg-1.3', 'ritual', 'invisibilidade', 'Invisibilidade', 5, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'lamina-paranormal', 'Lâmina Paranormal', 5, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'ouvir-sussurros', 'Ouvir Sussurros', 5, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'perturbacao', 'Perturbação', 5, 4, 'ocultista'),
  ('op-rpg-1.3', 'ritual', 'polarizacao-caeotica', 'Polarização Caótica', 5, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'terceiro-olho', 'Terceiro Olho', 5, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'velocidade-mortal', 'Velocidade Mortal', 5, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'vomitar-peste', 'Vomitar Peste', 5, 4, 'ocultista'),
  ('op-rpg-1.3', 'ritual', 'amaldicoar-armadura', 'Amaldiçoar Armadura', 25, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'controle-mental', 'Controle Mental', 25, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'distorcer-aparencia', 'Distorcer Aparência', 25, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'forma-monstruosa', 'Forma Monstruosa', 25, 4, 'ocultista'),
  ('op-rpg-1.3', 'ritual', 'invadir-mente', 'Invadir Mente', 25, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'localizacao', 'Localização', 25, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'nuvem-de-cinzas', 'Nuvem de Cinzas', 25, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'paradoxo', 'Paradoxo', 25, 4, 'ocultista'),
  ('op-rpg-1.3', 'ritual', 'salto-fantasma', 'Salto Fantasma', 25, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'teletransporte', 'Teletransporte', 25, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'videncia', 'Vidência', 25, 4, 'ocultista'),
  ('op-rpg-1.3', 'ritual', 'convocacao-instantanea', 'Convocação Instantânea', 50, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'deflagracao-de-energia', 'Deflagração de Energia', 50, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'dissipar-ritual', 'Dissipar Ritual', 50, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'fim-inevitavel', 'Fim Inevitável', 50, 4, 'ocultista'),
  ('op-rpg-1.3', 'ritual', 'muralha-de-energia', 'Muralha de Energia', 50, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'possuicao', 'Possuição', 50, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'purga-de-espirito', 'Purga de Espírito', 50, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'transcender', 'Transcender', 50, 4, 'ocultista'),
  ('op-rpg-1.3', 'ritual', 'fim-da-existencia', 'Fim da Existência', 75, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'invocar-o-medo', 'Invocar o Medo', 75, 4, 'ocultista'), ('op-rpg-1.3', 'ritual', 'medo', 'Medo', 75, 4, 'ocultista')
ON CONFLICT ("ruleset_version", "kind", "slug") DO NOTHING;
