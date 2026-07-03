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

export type UserRole = 'user' | 'admin';
export type UserPlan = 'free' | 'premium';
export type CampaignMemberRole = 'gm' | 'player' | 'spectator';
export type CharacterKind = 'pc' | 'npc';
export type EntityScope = 'system' | 'user' | 'campaign';
export type ItemKind = 'item' | 'document';

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
    role: text('role').notNull().$type<CampaignMemberRole>().default('player'),
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

export const characters = pgTable(
  'characters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id, { onDelete: 'cascade' }),
    ownerUserId: uuid('owner_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    kind: text('kind').notNull().$type<CharacterKind>().default('pc'),
    name: text('name').notNull(),
    description: text('description'),
    data: jsonb('data').notNull().$type<Record<string, unknown>>().default({}),
    imageAssetId: uuid('image_asset_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
    frozenAt: timestamp('frozen_at', { mode: 'string', withTimezone: true }),
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
    frozenIdx: index('characters_frozen_at_idx').on(table.frozenAt),
    deletedIdx: index('characters_deleted_at_idx').on(table.deletedAt),
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
export type CharacterRow = typeof characters.$inferSelect;
export type NewCharacterRow = typeof characters.$inferInsert;
export type MonsterRow = typeof monsters.$inferSelect;
export type NewMonsterRow = typeof monsters.$inferInsert;
export type ItemRow = typeof items.$inferSelect;
export type NewItemRow = typeof items.$inferInsert;
export type MediaAssetRow = typeof mediaAssets.$inferSelect;
export type NewMediaAssetRow = typeof mediaAssets.$inferInsert;
