export type CharacterKind = "pc" | "npc";
export type EntityScope = "system" | "user" | "campaign";
export type ItemKind = "item" | "document";

export type Character = {
  id: string;
  campaignId: string;
  ownerUserId: string | null;
  kind: CharacterKind;
  name: string;
  description?: string | null;
  space: number;
  data: Record<string, unknown>;
  imageAssetId?: string | null;
  frozenAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Item = {
  id: string;
  ownerUserId: string | null;
  campaignId: string | null;
  sourceItemId?: string | null;
  scope: EntityScope;
  kind: ItemKind;
  name: string;
  description?: string | null;
  data: Record<string, unknown>;
  imageAssetId?: string | null;
  locked: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Monster = {
  id: string;
  ownerUserId: string | null;
  campaignId: string | null;
  sourceMonsterId?: string | null;
  scope: EntityScope;
  name: string;
  description?: string | null;
  data: Record<string, unknown>;
  imageAssetId?: string | null;
  locked: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};
