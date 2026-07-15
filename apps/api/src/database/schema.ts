import {
  boolean,
  index,
  inet,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export type UserRole = 'user' | 'admin';
export type UserPlan = 'free' | 'premium';
/** Kept for response compatibility; persisted members are always players. */
export type CampaignMemberRole = 'player';
export type CharacterKind = 'pc' | 'npc';
export type NpcMode = 'narrative' | 'threat';
export type CharacterStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type CharacterArchiveReason =
  | 'replaced'
  | 'retired'
  | 'deceased'
  | 'campaign-deleted';
export type InvitationStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'expired';
export type EntityScope = 'system' | 'user' | 'campaign';
export type ItemKind = 'item' | 'document';
export type CampaignClueKind = 'text';
export type CampaignClueStyle =
  | 'plain-document'
  | 'handwritten-letter'
  | 'typewritten-report'
  | 'newspaper-clipping'
  | 'confidential-dossier';
export type RuleOptionKind = 'power' | 'ritual';

/** Versioned, data-driven game rules. Character sheets pin `rulesetVersion`. */
export const rulesets = pgTable('rulesets', {
  version: text('version').primaryKey(),
  name: text('name').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  minNex: integer('min_nex').notNull().default(5),
  maxNex: integer('max_nex').notNull().default(99),
  nexStep: integer('nex_step').notNull().default(5),
  createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const ruleClasses = pgTable(
  'rule_classes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    rulesetVersion: text('ruleset_version')
      .notNull()
      .references(() => rulesets.version, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    baseHp: integer('base_hp').notNull(),
    hpPerNex: integer('hp_per_nex').notNull(),
    baseSan: integer('base_san').notNull(),
    sanPerNex: integer('san_per_nex').notNull(),
    baseEp: integer('base_ep').notNull(),
    trainedSkills: integer('trained_skills').notNull(),
    trainingUpgradeBase: integer('training_upgrade_base').notNull(),
  },
  (table) => ({
    uniqueSlug: uniqueIndex('rule_classes_ruleset_slug_unique').on(
      table.rulesetVersion,
      table.slug,
    ),
  }),
);

export const rulePaths = pgTable(
  'rule_paths',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    classId: uuid('class_id')
      .notNull()
      .references(() => ruleClasses.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    minNex: integer('min_nex').notNull().default(10),
  },
  (table) => ({
    uniqueSlug: uniqueIndex('rule_paths_class_slug_unique').on(
      table.classId,
      table.slug,
    ),
  }),
);

export const ruleOrigins = pgTable(
  'rule_origins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    rulesetVersion: text('ruleset_version')
      .notNull()
      .references(() => rulesets.version, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
  },
  (table) => ({
    uniqueSlug: uniqueIndex('rule_origins_ruleset_slug_unique').on(
      table.rulesetVersion,
      table.slug,
    ),
  }),
);

/** Skills granted automatically by an origin. */
export const ruleOriginSkillGrants = pgTable(
  'rule_origin_skill_grants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    originId: uuid('origin_id')
      .notNull()
      .references(() => ruleOrigins.id, { onDelete: 'cascade' }),
    skillSlug: text('skill_slug').notNull(),
  },
  (table) => ({
    uniqueSkill: uniqueIndex('rule_origin_skill_grants_origin_skill_unique').on(
      table.originId,
      table.skillSlug,
    ),
  }),
);

/** A selectable origin skill group, such as Amnesic's two chosen skills. */
export const ruleOriginSkillChoices = pgTable(
  'rule_origin_skill_choices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    originId: uuid('origin_id')
      .notNull()
      .references(() => ruleOrigins.id, { onDelete: 'cascade' }),
    groupSlug: text('group_slug').notNull(),
    skillSlug: text('skill_slug').notNull(),
    selectionCount: integer('selection_count').notNull(),
  },
  (table) => ({
    uniqueSkill: uniqueIndex(
      'rule_origin_skill_choices_origin_group_skill_unique',
    ).on(table.originId, table.groupSlug, table.skillSlug),
  }),
);

export const ruleSkills = pgTable(
  'rule_skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    rulesetVersion: text('ruleset_version')
      .notNull()
      .references(() => rulesets.version, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
  },
  (table) => ({
    uniqueSlug: uniqueIndex('rule_skills_ruleset_slug_unique').on(
      table.rulesetVersion,
      table.slug,
    ),
  }),
);

/** Skills granted automatically by a class, such as Ocultism and Willpower. */
export const ruleClassSkillGrants = pgTable(
  'rule_class_skill_grants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    classId: uuid('class_id')
      .notNull()
      .references(() => ruleClasses.id, { onDelete: 'cascade' }),
    skillSlug: text('skill_slug').notNull(),
  },
  (table) => ({
    uniqueSkill: uniqueIndex('rule_class_skill_grants_class_skill_unique').on(
      table.classId,
      table.skillSlug,
    ),
  }),
);

/** A selectable class skill group, such as Combatant's weapon training. */
export const ruleClassSkillChoices = pgTable(
  'rule_class_skill_choices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    classId: uuid('class_id')
      .notNull()
      .references(() => ruleClasses.id, { onDelete: 'cascade' }),
    groupSlug: text('group_slug').notNull(),
    skillSlug: text('skill_slug').notNull(),
    selectionCount: integer('selection_count').notNull(),
  },
  (table) => ({
    uniqueSkill: uniqueIndex(
      'rule_class_skill_choices_class_group_skill_unique',
    ).on(table.classId, table.groupSlug, table.skillSlug),
  }),
);

export const ruleOptions = pgTable(
  'rule_options',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    rulesetVersion: text('ruleset_version')
      .notNull()
      .references(() => rulesets.version, { onDelete: 'cascade' }),
    kind: text('kind').notNull().$type<RuleOptionKind>(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    minNex: integer('min_nex').notNull().default(5),
    maxRank: integer('max_rank').notNull().default(1),
    requiredClassSlug: text('required_class_slug'),
  },
  (table) => ({
    uniqueSlug: uniqueIndex('rule_options_ruleset_kind_slug_unique').on(
      table.rulesetVersion,
      table.kind,
      table.slug,
    ),
  }),
);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: text('provider').notNull().default('google'),
    providerSubject: text('provider_subject').notNull(),
    email: text('email').notNull(),
    shortCode: text('short_code').notNull(),
    name: text('name').notNull(),
    picture: text('picture'),
    role: text('role').notNull().$type<UserRole>().default('user'),
    plan: text('plan').notNull().$type<UserPlan>().default('free'),
    deletedAt: timestamp('deleted_at', { mode: 'string', withTimezone: true }),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    lastLoginAt: timestamp('last_login_at', {
      mode: 'string',
      withTimezone: true,
    }),
    tokenVersion: integer('token_version').notNull().default(0),
  },
  (table) => ({
    providerSubjectIdx: uniqueIndex('users_provider_subject_unique').on(
      table.providerSubject,
    ),
    emailIdx: uniqueIndex('users_email_unique').on(table.email),
    shortCodeIdx: uniqueIndex('users_short_code_unique').on(table.shortCode),
    deletedAtIdx: index('users_deleted_at_idx').on(table.deletedAt),
  }),
);

export const authSessions = pgTable(
  'auth_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    expiresAt: timestamp('expires_at', {
      mode: 'string',
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp('revoked_at', { mode: 'string', withTimezone: true }),
    userAgent: text('user_agent'),
    ipAddress: inet('ip_address'),
  },
  (table) => ({
    refreshTokenUnique: uniqueIndex('auth_sessions_refresh_token_unique').on(
      table.refreshTokenHash,
    ),
    userIdIdx: index('auth_sessions_user_id_idx').on(table.userId),
    expiresAtIdx: index('auth_sessions_expires_at_idx').on(table.expiresAt),
  }),
);

export const mediaAssets = pgTable(
  'media_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerUserId: uuid('owner_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    campaignId: uuid('campaign_id').references(() => campaigns.id, {
      onDelete: 'set null',
    }),
    bucket: text('bucket').notNull(),
    storageKey: text('storage_key').notNull(),
    fileName: text('file_name').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    kind: text('kind').notNull().default('image'),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { mode: 'string', withTimezone: true }),
  },
  (table) => ({
    storageKeyIdx: uniqueIndex('media_assets_storage_key_unique').on(
      table.storageKey,
    ),
    ownerIdx: index('media_assets_owner_user_id_idx').on(table.ownerUserId),
    campaignIdx: index('media_assets_campaign_id_idx').on(table.campaignId),
  }),
);

export const campaigns = pgTable(
  'campaigns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerUserId: uuid('owner_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    description: text('description'),
    coverImageAssetId: uuid('cover_image_asset_id').references(
      () => mediaAssets.id,
      { onDelete: 'set null' },
    ),
    deletedAt: timestamp('deleted_at', { mode: 'string', withTimezone: true }),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    ownerIdx: index('campaigns_owner_user_id_idx').on(table.ownerUserId),
    deletedAtIdx: index('campaigns_deleted_at_idx').on(table.deletedAt),
  }),
);

export const campaignMembers = pgTable(
  'campaign_members',
  {
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.campaignId, table.userId] }),
    campaignIdx: index('campaign_members_campaign_id_idx').on(table.campaignId),
    userIdx: index('campaign_members_user_id_idx').on(table.userId),
  }),
);

/** One revocable, anonymous read-only access link per campaign. */
export const campaignSpectatorAccess = pgTable(
  'campaign_spectator_access',
  {
    campaignId: uuid('campaign_id')
      .primaryKey()
      .references(() => campaigns.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tokenHashUnique: uniqueIndex(
      'campaign_spectator_access_token_hash_unique',
    ).on(table.tokenHash),
  }),
);

export const campaignClues = pgTable(
  'campaign_clues',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull().$type<CampaignClueKind>().default('text'),
    gmLabel: text('gm_label').notNull(),
    title: text('title'),
    privateNotes: text('private_notes'),
    content: jsonb('content').notNull().$type<Record<string, unknown>>(),
    style: text('style')
      .notNull()
      .$type<CampaignClueStyle>()
      .default('plain-document'),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    campaignUpdatedIdx: index('campaign_clues_campaign_updated_at_idx').on(
      table.campaignId,
      table.updatedAt,
    ),
  }),
);

export const characters = pgTable(
  'characters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id').references(() => campaigns.id, {
      onDelete: 'restrict',
    }),
    ownerUserId: uuid('owner_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    sourceCharacterId: uuid('source_character_id'),
    kind: text('kind').notNull().$type<CharacterKind>().default('pc'),
    status: text('status').notNull().$type<CharacterStatus>().default('draft'),
    npcMode: text('npc_mode').$type<NpcMode>(),
    sheetLabel: text('sheet_label'),
    rulesetVersion: text('ruleset_version')
      .notNull()
      .default('op-rpg-1.3')
      .references(() => rulesets.version),
    name: text('name').notNull(),
    concept: text('concept'),
    gender: text('gender'),
    age: integer('age'),
    appearance: text('appearance'),
    personality: text('personality'),
    history: text('history'),
    objective: text('objective'),
    playerNotes: text('player_notes'),
    origin: text('origin'),
    characterClass: text('character_class'),
    path: text('path'),
    nex: integer('nex').notNull().default(5),
    agility: integer('agility').notNull().default(1),
    strength: integer('strength').notNull().default(1),
    intellect: integer('intellect').notNull().default(1),
    presence: integer('presence').notNull().default(1),
    vigor: integer('vigor').notNull().default(1),
    maxHp: integer('max_hp'),
    maxSan: integer('max_san'),
    maxEp: integer('max_ep'),
    epLimit: integer('ep_limit'),
    defense: integer('defense'),
    dodge: integer('dodge'),
    block: integer('block'),
    movement: integer('movement'),
    carryCapacity: integer('carry_capacity'),
    imageAssetId: uuid('image_asset_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
    frozenAt: timestamp('frozen_at', { mode: 'string', withTimezone: true }),
    campaignAttachedAt: timestamp('campaign_attached_at', {
      mode: 'string',
      withTimezone: true,
    }),
    statusChangedAt: timestamp('status_changed_at', {
      mode: 'string',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    archiveReason: text('archive_reason').$type<CharacterArchiveReason>(),
    deletedAt: timestamp('deleted_at', { mode: 'string', withTimezone: true }),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    campaignIdx: index('characters_campaign_id_idx').on(table.campaignId),
    ownerIdx: index('characters_owner_user_id_idx').on(table.ownerUserId),
    sourceIdx: index('characters_source_character_id_idx').on(
      table.sourceCharacterId,
    ),
    frozenIdx: index('characters_frozen_at_idx').on(table.frozenAt),
    activeCampaignPlayerUnique: uniqueIndex(
      'characters_active_campaign_player_unique',
    )
      .on(table.campaignId, table.ownerUserId)
      .where(sql`status = 'active' AND kind = 'pc' AND deleted_at IS NULL`),
    deletedIdx: index('characters_deleted_at_idx').on(table.deletedAt),
  }),
);

export const characterSkills = pgTable(
  'character_skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    degree: text('degree').notNull().default('trained'),
  },
  (table) => ({
    characterIdx: index('character_skills_character_id_idx').on(
      table.characterId,
    ),
  }),
);

export const characterSelections = pgTable(
  'character_selections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    category: text('category').notNull(),
    name: text('name').notNull(),
    rank: integer('rank').notNull().default(1),
  },
  (table) => ({
    characterIdx: index('character_selections_character_id_idx').on(
      table.characterId,
    ),
  }),
);

/** A private, staged revision for an active player character. */
export const characterEditDrafts = pgTable(
  'character_edit_drafts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    rulesetVersion: text('ruleset_version')
      .notNull()
      .references(() => rulesets.version),
    name: text('name').notNull(),
    sheetLabel: text('sheet_label'),
    concept: text('concept'),
    gender: text('gender'),
    age: integer('age'),
    appearance: text('appearance'),
    personality: text('personality'),
    history: text('history'),
    objective: text('objective'),
    playerNotes: text('player_notes'),
    origin: text('origin'),
    characterClass: text('character_class'),
    path: text('path'),
    nex: integer('nex').notNull(),
    agility: integer('agility').notNull(),
    strength: integer('strength').notNull(),
    intellect: integer('intellect').notNull(),
    presence: integer('presence').notNull(),
    vigor: integer('vigor').notNull(),
    imageAssetId: uuid('image_asset_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    characterIdx: uniqueIndex('character_edit_drafts_character_id_unique').on(
      table.characterId,
    ),
  }),
);

export const characterEditDraftSkills = pgTable(
  'character_edit_draft_skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    draftId: uuid('draft_id')
      .notNull()
      .references(() => characterEditDrafts.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    degree: text('degree').notNull().default('trained'),
  },
  (table) => ({
    draftIdx: index('character_edit_draft_skills_draft_id_idx').on(
      table.draftId,
    ),
  }),
);

export const characterEditDraftPowers = pgTable(
  'character_edit_draft_powers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    draftId: uuid('draft_id')
      .notNull()
      .references(() => characterEditDrafts.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    rank: integer('rank').notNull().default(1),
  },
  (table) => ({
    draftIdx: index('character_edit_draft_powers_draft_id_idx').on(
      table.draftId,
    ),
  }),
);

/** Typed, campaign-scoped NPC threat stat block. Player Characters never use
 * these tables; their permanent build remains in `characters`. */
export const npcStatBlocks = pgTable('npc_stat_blocks', {
  characterId: uuid('character_id')
    .primaryKey()
    .references(() => characters.id, { onDelete: 'cascade' }),
  threatLevel: integer('threat_level').notNull().default(0),
  hp: integer('hp').notNull().default(1),
  defense: integer('defense').notNull().default(10),
  fortitude: integer('fortitude').notNull().default(0),
  reflex: integer('reflex').notNull().default(0),
  will: integer('will').notNull().default(0),
  perception: integer('perception').notNull().default(0),
  movement: integer('movement').notNull().default(9),
  size: text('size').notNull().default('medium'),
  senses: text('senses'),
  notes: text('notes'),
  updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const npcAttacks = pgTable(
  'npc_attacks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    test: text('test'),
    damage: text('damage'),
    range: text('range'),
    critical: text('critical'),
    effect: text('effect'),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => ({
    characterIdx: index('npc_attacks_character_id_idx').on(table.characterId),
  }),
);

export const npcResistances = pgTable(
  'npc_resistances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    damageType: text('damage_type').notNull(),
    value: integer('value').notNull().default(0),
    kind: text('kind').notNull().default('resistance'),
  },
  (table) => ({
    characterIdx: index('npc_resistances_character_id_idx').on(
      table.characterId,
    ),
  }),
);

export const npcAbilities = pgTable(
  'npc_abilities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').notNull(),
    actionCost: text('action_cost'),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => ({
    characterIdx: index('npc_abilities_character_id_idx').on(table.characterId),
  }),
);

export const campaignCharacterStates = pgTable('campaign_character_states', {
  characterId: uuid('character_id')
    .primaryKey()
    .references(() => characters.id, { onDelete: 'cascade' }),
  currentHp: integer('current_hp').notNull().default(0),
  currentSan: integer('current_san').notNull().default(0),
  currentEp: integer('current_ep').notNull().default(0),
  conditions: text('conditions').notNull().default(''),
  temporaryEffects: text('temporary_effects').notNull().default(''),
  gmNotes: text('gm_notes'),
  updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const campaignCharacterRituals = pgTable(
  'campaign_character_rituals',
  {
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    ritualSlug: text('ritual_slug').notNull(),
    rank: integer('rank').notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.characterId, table.ritualSlug] }),
  }),
);

export const characterInventory = pgTable(
  'character_inventory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    characterId: uuid('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id').references(() => items.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    quantity: integer('quantity').notNull().default(1),
    isEquipped: boolean('is_equipped').notNull().default(false),
    notes: text('notes'),
    addedByUserId: uuid('added_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    characterIdx: index('character_inventory_character_id_idx').on(
      table.characterId,
    ),
  }),
);

export const campaignInvitations = pgTable(
  'campaign_invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id, { onDelete: 'cascade' }),
    invitedUserId: uuid('invited_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    invitedByUserId: uuid('invited_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status')
      .notNull()
      .$type<InvitationStatus>()
      .default('pending'),
    expiresAt: timestamp('expires_at', {
      mode: 'string',
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp('resolved_at', {
      mode: 'string',
      withTimezone: true,
    }),
  },
  (table) => ({
    campaignIdx: index('campaign_invitations_campaign_id_idx').on(
      table.campaignId,
    ),
    invitedUserIdx: index('campaign_invitations_invited_user_id_idx').on(
      table.invitedUserId,
    ),
    pendingCampaignUserUnique: uniqueIndex(
      'campaign_invitations_pending_campaign_user_unique',
    )
      .on(table.campaignId, table.invitedUserId)
      .where(sql`status = 'pending'`),
    pendingCapacityIdx: index('campaign_invitations_pending_capacity_idx')
      .on(table.campaignId)
      .where(sql`status = 'pending'`),
  }),
);

export const monsters = pgTable(
  'monsters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerUserId: uuid('owner_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    campaignId: uuid('campaign_id').references(() => campaigns.id, {
      onDelete: 'cascade',
    }),
    sourceMonsterId: uuid('source_monster_id'),
    scope: text('scope').notNull().$type<EntityScope>().default('system'),
    name: text('name').notNull(),
    description: text('description'),
    data: jsonb('data').notNull().$type<Record<string, unknown>>().default({}),
    imageAssetId: uuid('image_asset_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
    locked: boolean('locked').notNull().default(false),
    deletedAt: timestamp('deleted_at', { mode: 'string', withTimezone: true }),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    ownerIdx: index('monsters_owner_user_id_idx').on(table.ownerUserId),
    campaignIdx: index('monsters_campaign_id_idx').on(table.campaignId),
    scopeIdx: index('monsters_scope_idx').on(table.scope),
    deletedIdx: index('monsters_deleted_at_idx').on(table.deletedAt),
  }),
);

export const items = pgTable(
  'items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerUserId: uuid('owner_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    campaignId: uuid('campaign_id').references(() => campaigns.id, {
      onDelete: 'cascade',
    }),
    sourceItemId: uuid('source_item_id'),
    scope: text('scope').notNull().$type<EntityScope>().default('system'),
    kind: text('kind').notNull().$type<ItemKind>().default('item'),
    name: text('name').notNull(),
    description: text('description'),
    data: jsonb('data').notNull().$type<Record<string, unknown>>().default({}),
    imageAssetId: uuid('image_asset_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
    locked: boolean('locked').notNull().default(false),
    deletedAt: timestamp('deleted_at', { mode: 'string', withTimezone: true }),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    ownerIdx: index('items_owner_user_id_idx').on(table.ownerUserId),
    campaignIdx: index('items_campaign_id_idx').on(table.campaignId),
    scopeIdx: index('items_scope_idx').on(table.scope),
    kindIdx: index('items_kind_idx').on(table.kind),
    deletedIdx: index('items_deleted_at_idx').on(table.deletedAt),
  }),
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type AuthSessionRow = typeof authSessions.$inferSelect;
export type NewAuthSessionRow = typeof authSessions.$inferInsert;
export type CampaignRow = typeof campaigns.$inferSelect;
export type NewCampaignRow = typeof campaigns.$inferInsert;
export type CampaignMemberRow = typeof campaignMembers.$inferSelect;
export type NewCampaignMemberRow = typeof campaignMembers.$inferInsert;
export type CampaignClueRow = typeof campaignClues.$inferSelect;
export type NewCampaignClueRow = typeof campaignClues.$inferInsert;
export type CharacterRow = typeof characters.$inferSelect;
export type NewCharacterRow = typeof characters.$inferInsert;
export type CharacterEditDraftRow = typeof characterEditDrafts.$inferSelect;
export type NewCharacterEditDraftRow = typeof characterEditDrafts.$inferInsert;
export type MonsterRow = typeof monsters.$inferSelect;
export type NewMonsterRow = typeof monsters.$inferInsert;
export type ItemRow = typeof items.$inferSelect;
export type NewItemRow = typeof items.$inferInsert;
export type MediaAssetRow = typeof mediaAssets.$inferSelect;
export type NewMediaAssetRow = typeof mediaAssets.$inferInsert;
