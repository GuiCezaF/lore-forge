CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'google',
  provider_subject text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  short_code text NOT NULL UNIQUE,
  name text NOT NULL,
  picture text,
  role text NOT NULL DEFAULT 'user',
  plan text NOT NULL DEFAULT 'free',
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz,
  token_version integer NOT NULL DEFAULT 0,
  CONSTRAINT users_role_check CHECK (role IN ('user', 'admin')),
  CONSTRAINT users_plan_check CHECK (plan IN ('free', 'premium'))
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  user_agent text,
  ip_address inet
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);

CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  campaign_id uuid,
  bucket text NOT NULL,
  storage_key text NOT NULL UNIQUE,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  kind text NOT NULL DEFAULT 'image',
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_media_assets_owner_user_id ON media_assets(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_campaign_id ON media_assets(campaign_id);

CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  cover_image_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_owner_user_id ON campaigns(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_deleted_at ON campaigns(deleted_at);

ALTER TABLE media_assets
  ADD CONSTRAINT media_assets_campaign_fk
  FOREIGN KEY (campaign_id)
  REFERENCES campaigns(id)
  ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS campaign_members (
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'player',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (campaign_id, user_id),
  CONSTRAINT campaign_members_role_check CHECK (role IN ('gm', 'player', 'spectator'))
);

CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign_id ON campaign_members(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_user_id ON campaign_members(user_id);

CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'pc',
  name text NOT NULL,
  description text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  frozen_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT characters_kind_check CHECK (kind IN ('pc', 'npc'))
);

CREATE INDEX IF NOT EXISTS idx_characters_campaign_id ON characters(campaign_id);
CREATE INDEX IF NOT EXISTS idx_characters_owner_user_id ON characters(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_characters_frozen_at ON characters(frozen_at);
CREATE INDEX IF NOT EXISTS idx_characters_deleted_at ON characters(deleted_at);

CREATE TABLE IF NOT EXISTS monsters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  source_monster_id uuid,
  scope text NOT NULL DEFAULT 'system',
  name text NOT NULL,
  description text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  locked boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT monsters_scope_check CHECK (scope IN ('system', 'user', 'campaign'))
);

CREATE INDEX IF NOT EXISTS idx_monsters_owner_user_id ON monsters(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_monsters_campaign_id ON monsters(campaign_id);
CREATE INDEX IF NOT EXISTS idx_monsters_scope ON monsters(scope);
CREATE INDEX IF NOT EXISTS idx_monsters_deleted_at ON monsters(deleted_at);

CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  source_item_id uuid,
  scope text NOT NULL DEFAULT 'system',
  kind text NOT NULL DEFAULT 'item',
  name text NOT NULL,
  description text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  locked boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT items_scope_check CHECK (scope IN ('system', 'user', 'campaign')),
  CONSTRAINT items_kind_check CHECK (kind IN ('item', 'document'))
);

CREATE INDEX IF NOT EXISTS idx_items_owner_user_id ON items(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_items_campaign_id ON items(campaign_id);
CREATE INDEX IF NOT EXISTS idx_items_scope ON items(scope);
CREATE INDEX IF NOT EXISTS idx_items_kind ON items(kind);
CREATE INDEX IF NOT EXISTS idx_items_deleted_at ON items(deleted_at);
