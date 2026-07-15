import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { and, asc, eq, isNull, or, sql } from 'drizzle-orm';
import { CampaignsService } from '../campaigns/campaigns.service';
import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import {
  campaignCharacterStates,
  campaignCharacterRituals,
  campaignMembers,
  campaigns,
  characterEditDraftPowers,
  characterEditDraftSkills,
  characterEditDrafts,
  characterInventory,
  characterSelections,
  characterSkills,
  characters,
  mediaAssets,
  npcAbilities,
  npcAttacks,
  npcResistances,
  npcStatBlocks,
  type CharacterKind,
  type CharacterArchiveReason,
  type CharacterStatus,
  type NpcMode,
} from '../database/schema';
import {
  calculateDerived,
  analyzeBuild,
  type CharacterSelectionInput,
  type CharacterSkillInput,
  validateBuild,
} from './ordem-ruleset';
import { RulesService, type RulesetCatalog } from '../rules/rules.service';
import { MediaService } from '../media/media.service';
import { NpcStatBlocksService } from './npc-stat-blocks.service';
import { normalizeCampaignStatePatch } from './normalize-campaign-state-patch';
import { parseCampaignStatePatch } from './parse-campaign-state-patch';

type CampaignResourceKey = 'currentHp' | 'currentSan' | 'currentEp';
type CampaignResourceMaximums = Record<CampaignResourceKey, number>;

export interface CharacterDto {
  id: string;
  campaignId: string | null;
  campaignName: string | null;
  campaignAttachedAt: string | null;
  statusChangedAt: string;
  archiveReason: CharacterArchiveReason | null;
  ownerUserId: string | null;
  sourceCharacterId: string | null;
  kind: CharacterKind;
  status: CharacterStatus;
  npcMode: NpcMode | null;
  rulesetVersion: string;
  name: string;
  concept: string | null;
  gender: string | null;
  age: number | null;
  appearance: string | null;
  personality: string | null;
  history: string | null;
  objective: string | null;
  playerNotes: string | null;
  origin: string | null;
  characterClass: string | null;
  path: string | null;
  nex: number;
  attributes: {
    agility: number;
    strength: number;
    intellect: number;
    presence: number;
    vigor: number;
  };
  skills: Array<{ name: string; degree: string }>;
  powers: Array<{ name: string; rank: number }>;
  derived: {
    maxHp: number | null;
    maxSan: number | null;
    maxEp: number | null;
    epLimit: number | null;
    defense: number | null;
    dodge: number | null;
    block: number | null;
    movement: number | null;
    carryCapacity: number | null;
  };
  imageAssetId: string | null;
  createdAt: string;
  updatedAt: string;
  permissions: {
    canCopy: boolean;
    canViewCampaignState: boolean;
    canEditPermanentData: boolean;
    canEditPlayState: boolean;
    canManageRituals: boolean;
    canManageInventory: boolean;
  };
  hasEditDraft: boolean;
}

export interface CharacterEditDraftDto {
  id: string;
  characterId: string;
  rulesetVersion: string;
  name: string;
  concept: string | null;
  gender: string | null;
  age: number | null;
  appearance: string | null;
  personality: string | null;
  history: string | null;
  objective: string | null;
  playerNotes: string | null;
  origin: string | null;
  characterClass: string | null;
  path: string | null;
  nex: number;
  attributes: {
    agility: number;
    strength: number;
    intellect: number;
    presence: number;
    vigor: number;
  };
  imageAssetId: string | null;
  skills: CharacterSkillInput[];
  powers: Array<{ name: string; rank: number }>;
  derived: CharacterDto['derived'];
  conflicts: Array<{
    code: string;
    field: string;
    optionId?: string;
    message: string;
  }>;
  updatedAt: string;
}

export interface CampaignPlayStateDto {
  currentHp: number | null;
  maxHp: number | null;
  currentSan: number | null;
  maxSan: number | null;
  currentEp: number | null;
  maxEp: number | null;
  conditions: string;
  temporaryEffects: string;
  gmNotes: string | null;
  updatedAt: string;
  rituals: Array<{
    slug: string;
    name: string;
    rank: number;
    maxRank: number;
  }>;
  inventory: Array<{
    id: string;
    itemId: string | null;
    name: string;
    quantity: number;
    isEquipped: boolean;
    notes: string | null;
    addedByUserId: string | null;
    createdAt: string;
  }>;
}

export type CharacterInput = {
  name: string;
  concept?: string | null;
  gender?: string | null;
  age?: number | null;
  appearance?: string | null;
  personality?: string | null;
  history?: string | null;
  objective?: string | null;
  playerNotes?: string | null;
  origin?: string | null;
  characterClass?: string | null;
  path?: string | null;
  nex?: number;
  agility?: number;
  strength?: number;
  intellect?: number;
  presence?: number;
  vigor?: number;
  imageAssetId?: string | null;
  status?: CharacterStatus;
  npcMode?: NpcMode;
  skills?: CharacterSkillInput[];
  selections?: CharacterSelectionInput[];
  npcStatBlock?: NpcStatBlockInput;
};

export interface NpcStatBlockInput {
  threatLevel?: number;
  hp?: number;
  defense?: number;
  fortitude?: number;
  reflex?: number;
  will?: number;
  perception?: number;
  movement?: number;
  size?: string;
  senses?: string | null;
  notes?: string | null;
  attacks?: Array<{
    name: string;
    test?: string | null;
    damage?: string | null;
    range?: string | null;
    critical?: string | null;
    effect?: string | null;
  }>;
  resistances?: Array<{
    damageType?: string;
    type?: string;
    value?: number | string;
    kind?: 'resistance' | 'vulnerability' | 'immunity';
  }>;
  abilities?: Array<{
    name: string;
    description: string;
    actionCost?: string | null;
  }>;
}

const DEFAULT_RULESET_VERSION = 'op-rpg-1.3';

@Injectable()
export class CharactersService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly campaignsService: CampaignsService,
    private readonly rulesService: RulesService,
    private readonly mediaService: MediaService,
    private readonly npcStatBlocksService?: NpcStatBlocksService,
  ) {}

  async listMyCharacters(userId: string): Promise<CharacterDto[]> {
    const rows = await this.db
      .select()
      .from(characters)
      .where(
        and(
          isNull(characters.deletedAt),
          or(eq(characters.ownerUserId, userId), eq(characters.kind, 'npc')),
        ),
      );
    const accessible: typeof rows = [];
    for (const row of rows) {
      if (
        row.ownerUserId === userId ||
        (row.campaignId &&
          (await this.canAccessCampaign(userId, row.campaignId)))
      )
        accessible.push(row);
    }
    return accessible
      .filter((row) => !(row.kind === 'npc' && !row.campaignId))
      .map((row) => this.toDto(row, row.ownerUserId === userId));
  }

  async listNpcsForGm(userId: string): Promise<CharacterDto[]> {
    const rows = await this.db
      .select()
      .from(characters)
      .where(and(eq(characters.kind, 'npc'), isNull(characters.deletedAt)));
    const manageable: typeof rows = [];
    for (const row of rows) {
      if (row.ownerUserId === userId && !row.campaignId) {
        manageable.push(row);
        continue;
      }
      if (!row.campaignId) continue;
      try {
        await this.ensureManager(userId, row.campaignId);
        manageable.push(row);
      } catch (error) {
        if (
          !(error instanceof ForbiddenException) &&
          !(error instanceof NotFoundException)
        )
          throw error;
      }
    }
    return manageable.map((row) => this.toDto(row, row.ownerUserId === userId));
  }

  async createPlayerCharacter(
    userId: string,
    body: CharacterInput,
  ): Promise<CharacterDto> {
    this.ensureName(body.name);
    await this.ensureOwnedImageAsset(userId, body.imageAssetId);
    const attributes = this.getAttributes(body);
    const nex = body.nex ?? 5;
    await this.validatePlayerBuild({ ...body, nex, attributes });
    // Drafts deliberately retain incomplete or temporarily invalid values.
    // A derived value is only useful once the inputs can be calculated; it
    // must never prevent the persisted draft from being recovered later.
    const derived = await this.getDerivedForDraft(
      body.characterClass,
      nex,
      attributes,
      body.status !== 'active',
    );
    const [row] = await this.db
      .insert(characters)
      .values({
        ownerUserId: userId,
        kind: 'pc',
        status: body.status ?? 'draft',
        rulesetVersion: DEFAULT_RULESET_VERSION,
        name: body.name.trim(),
        concept: body.concept?.trim() || null,
        origin: body.origin?.trim() || null,
        characterClass: body.characterClass?.trim() || null,
        path: body.path?.trim() || null,
        nex,
        ...attributes,
        ...derived,
        imageAssetId: body.imageAssetId ?? null,
      })
      .returning();
    await this.replaceBuildSelections(row.id, body);
    return this.toDto(row);
  }

  /**
   * Drafts use the same typed sheet as a final character.  This deliberately
   * avoids a JSON "draft payload" that would bypass the normal model; the
   * placeholder name lets a player persist an entirely blank first step.
   */
  async createDraft(
    userId: string,
    body: Partial<CharacterInput> = {},
  ): Promise<CharacterDto> {
    return this.createPlayerCharacter(userId, {
      ...body,
      name: body.name?.trim() || 'Untitled agent',
      status: 'draft',
    });
  }

  async createNpcSheet(
    userId: string,
    body: CharacterInput & { npcMode?: NpcMode },
  ): Promise<CharacterDto> {
    this.ensureName(body.name);
    await this.ensureOwnedImageAsset(userId, body.imageAssetId);
    const attributes = this.getAttributes(body);
    const [row] = await this.db
      .insert(characters)
      .values({
        ownerUserId: userId,
        campaignId: null,
        kind: 'npc',
        status: body.status ?? 'active',
        npcMode: body.npcMode ?? 'narrative',
        rulesetVersion: DEFAULT_RULESET_VERSION,
        name: body.name.trim(),
        concept: body.concept?.trim() || null,
        nex: body.nex ?? 5,
        ...attributes,
        imageAssetId: body.imageAssetId ?? null,
      })
      .returning();
    if (row.npcMode === 'threat')
      await this.npcStatBlocksService?.replace(
        row.id,
        body.npcStatBlock ?? {},
        true,
      );
    return this.toDto(row);
  }

  /** @deprecated Campaign NPCs are now created independently and attached once. */
  async createNpc(
    userId: string,
    campaignId: string,
    body: CharacterInput & { npcMode?: NpcMode },
  ): Promise<CharacterDto> {
    await this.ensureManager(userId, campaignId);
    return this.createNpcSheet(userId, body);
  }

  async createNpcDraft(userId: string, body: Partial<CharacterInput> = {}) {
    return this.createNpcSheet(userId, {
      ...body,
      name: body.name?.trim() || 'Untitled NPC',
      status: 'draft',
      npcMode: body.npcMode ?? 'narrative',
    });
  }

  async saveDraft(
    userId: string,
    characterId: string,
    body: Partial<CharacterInput>,
  ): Promise<CharacterDto> {
    const current = await this.getAccessibleCharacter(userId, characterId);
    if (current.status !== 'draft') {
      throw new BadRequestException('Only draft sheets can be auto-saved');
    }
    if (current.kind === 'pc' && current.ownerUserId !== userId)
      throw new ForbiddenException('Only the sheet owner can save this draft');
    if (current.kind === 'npc' && current.ownerUserId !== userId)
      throw new ForbiddenException('Only the sheet owner can save this NPC draft');
    return this.updateCharacter(userId, characterId, {
      ...body,
      name: body.name ?? current.name,
      status: 'draft',
    });
  }

  async getCharacter(
    userId: string,
    characterId: string,
  ): Promise<CharacterDto> {
    const row = await this.getAccessibleCharacter(userId, characterId);
    return this.getCharacterDto(row, row.ownerUserId === userId, userId);
  }

  async beginEditDraft(
    userId: string,
    characterId: string,
  ): Promise<CharacterEditDraftDto> {
    const character = await this.getAccessibleCharacter(userId, characterId);
    this.ensureCanEditActivePlayerCharacter(userId, character);
    const [existing] = await this.db
      .select()
      .from(characterEditDrafts)
      .where(eq(characterEditDrafts.characterId, characterId));
    if (existing) return this.getEditDraftDto(existing);

    const [skills, powers] = await Promise.all([
      this.db
        .select({ name: characterSkills.name, degree: characterSkills.degree })
        .from(characterSkills)
        .where(eq(characterSkills.characterId, characterId)),
      this.db
        .select({
          name: characterSelections.name,
          rank: characterSelections.rank,
        })
        .from(characterSelections)
        .where(
          and(
            eq(characterSelections.characterId, characterId),
            eq(characterSelections.category, 'power'),
          ),
        ),
    ]);
    const [draft] = await this.db
      .insert(characterEditDrafts)
      .values({
        characterId: character.id,
        rulesetVersion: character.rulesetVersion,
        name: character.name,
        concept: character.concept,
        gender: character.gender,
        age: character.age,
        appearance: character.appearance,
        personality: character.personality,
        history: character.history,
        objective: character.objective,
        playerNotes: character.playerNotes,
        origin: character.origin,
        characterClass: character.characterClass,
        path: character.path,
        nex: character.nex,
        agility: character.agility,
        strength: character.strength,
        intellect: character.intellect,
        presence: character.presence,
        vigor: character.vigor,
        imageAssetId: character.imageAssetId,
      })
      .returning();
    if (skills.length)
      await this.db
        .insert(characterEditDraftSkills)
        .values(skills.map((skill) => ({ draftId: draft.id, ...skill })));
    if (powers.length)
      await this.db
        .insert(characterEditDraftPowers)
        .values(powers.map((power) => ({ draftId: draft.id, ...power })));
    return this.getEditDraftDto(draft);
  }

  async saveEditDraft(
    userId: string,
    characterId: string,
    body: CharacterInput,
  ): Promise<CharacterEditDraftDto> {
    const character = await this.getAccessibleCharacter(userId, characterId);
    this.ensureCanEditActivePlayerCharacter(userId, character);
    const [current] = await this.db
      .select()
      .from(characterEditDrafts)
      .where(eq(characterEditDrafts.characterId, characterId));
    if (!current) throw new NotFoundException('Edit draft not found');
    this.ensureName(body.name);
    await this.ensureOwnedImageAsset(userId, body.imageAssetId);
    const now = new Date().toISOString();
    const [draft] = await this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(characterEditDrafts)
        .set({
          name: body.name.trim(),
          concept: body.concept?.trim() || null,
          gender: body.gender?.trim() || null,
          age: body.age ?? null,
          appearance: body.appearance?.trim() || null,
          personality: body.personality?.trim() || null,
          history: body.history?.trim() || null,
          objective: body.objective?.trim() || null,
          playerNotes: body.playerNotes?.trim() || null,
          origin: body.origin?.trim() || null,
          characterClass: body.characterClass?.trim() || null,
          path: body.path?.trim() || null,
          nex: body.nex ?? current.nex,
          ...this.getAttributes(body),
          imageAssetId: body.imageAssetId ?? null,
          updatedAt: now,
        })
        .where(eq(characterEditDrafts.id, current.id))
        .returning();
      await tx
        .delete(characterEditDraftSkills)
        .where(eq(characterEditDraftSkills.draftId, current.id));
      await tx
        .delete(characterEditDraftPowers)
        .where(eq(characterEditDraftPowers.draftId, current.id));
      if (body.skills?.length)
        await tx.insert(characterEditDraftSkills).values(
          body.skills.map((skill) => ({
            draftId: current.id,
            name: skill.name,
            degree: skill.degree ?? 'trained',
          })),
        );
      const powers = (body.selections ?? []).filter(
        (selection) => selection.category === 'power',
      );
      if (powers.length)
        await tx.insert(characterEditDraftPowers).values(
          powers.map((power) => ({
            draftId: current.id,
            name: power.name,
            rank: power.rank ?? 1,
          })),
        );
      return [updated];
    });
    if (current.imageAssetId !== draft.imageAssetId)
      await this.mediaService.releaseImageIfUnreferenced(
        userId,
        current.imageAssetId,
      );
    return this.getEditDraftDto(draft);
  }

  async publishEditDraft(
    userId: string,
    characterId: string,
  ): Promise<CharacterDto> {
    const character = await this.getAccessibleCharacter(userId, characterId);
    this.ensureCanEditActivePlayerCharacter(userId, character);
    const [draft] = await this.db
      .select()
      .from(characterEditDrafts)
      .where(eq(characterEditDrafts.characterId, characterId));
    if (!draft) throw new NotFoundException('Edit draft not found');
    const review = await this.getEditDraftDto(draft);
    const catalog = await this.rulesService.getCatalog(draft.rulesetVersion);
    const ritualConflicts = await this.getCampaignRitualConflicts(
      characterId,
      catalog,
      draft.characterClass,
      draft.nex,
    );
    const conflicts = [...review.conflicts, ...ritualConflicts];
    if (conflicts.length) throw new UnprocessableEntityException({ conflicts });
    const derived = calculateDerived(
      catalog,
      draft.characterClass!,
      draft.nex,
      {
        agility: draft.agility,
        strength: draft.strength,
        intellect: draft.intellect,
        presence: draft.presence,
        vigor: draft.vigor,
      },
    );
    const [published] = await this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(characters)
        .set({
          name: draft.name,
          concept: draft.concept,
          gender: draft.gender,
          age: draft.age,
          appearance: draft.appearance,
          personality: draft.personality,
          history: draft.history,
          objective: draft.objective,
          playerNotes: draft.playerNotes,
          origin: draft.origin,
          characterClass: draft.characterClass,
          path: draft.path,
          nex: draft.nex,
          agility: draft.agility,
          strength: draft.strength,
          intellect: draft.intellect,
          presence: draft.presence,
          vigor: draft.vigor,
          imageAssetId: draft.imageAssetId,
          ...derived,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(characters.id, characterId))
        .returning();
      if (updated.campaignId) {
        const now = new Date().toISOString();
        await tx
          .insert(campaignCharacterStates)
          .values({
            characterId,
            currentHp: derived.maxHp,
            currentSan: derived.maxSan,
            currentEp: derived.maxEp,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: campaignCharacterStates.characterId,
            set: {
              currentHp: sql`least(${campaignCharacterStates.currentHp}, ${derived.maxHp})`,
              currentSan: sql`least(${campaignCharacterStates.currentSan}, ${derived.maxSan})`,
              currentEp: sql`least(${campaignCharacterStates.currentEp}, ${derived.maxEp})`,
              updatedAt: now,
            },
          });
      }
      await tx
        .delete(characterSkills)
        .where(eq(characterSkills.characterId, characterId));
      await tx
        .delete(characterSelections)
        .where(
          and(
            eq(characterSelections.characterId, characterId),
            eq(characterSelections.category, 'power'),
          ),
        );
      if (review.skills.length)
        await tx.insert(characterSkills).values(
          review.skills.map((skill) => ({
            characterId,
            name: skill.name,
            degree: skill.degree ?? 'trained',
          })),
        );
      if (review.powers.length)
        await tx.insert(characterSelections).values(
          review.powers.map((power) => ({
            characterId,
            category: 'power',
            name: power.name,
            rank: power.rank,
          })),
        );
      await tx
        .delete(characterEditDrafts)
        .where(eq(characterEditDrafts.id, draft.id));
      return [updated];
    });
    // TODO(live-events): emit a post-transaction permanent-sheet update event.
    if (character.imageAssetId !== published.imageAssetId)
      await this.mediaService.releaseImageIfUnreferenced(
        userId,
        character.imageAssetId,
      );
    return this.getCharacterDto(published, true, userId);
  }

  async discardEditDraft(userId: string, characterId: string): Promise<void> {
    const character = await this.getAccessibleCharacter(userId, characterId);
    this.ensureCanEditActivePlayerCharacter(userId, character);
    const [draft] = await this.db
      .delete(characterEditDrafts)
      .where(eq(characterEditDrafts.characterId, characterId))
      .returning();
    if (draft)
      await this.mediaService.releaseImageIfUnreferenced(
        userId,
        draft.imageAssetId,
      );
  }

  async updateCharacter(
    userId: string,
    characterId: string,
    body: CharacterInput,
  ): Promise<CharacterDto> {
    const current = await this.getAccessibleCharacter(userId, characterId);
    if (current.kind === 'pc' && current.ownerUserId !== userId)
      throw new ForbiddenException(
        'Only the sheet owner can edit a Player Character',
      );
    if (current.kind === 'pc' && current.status === 'archived') {
      throw new ConflictException(
        'Archived sheets are read-only; copy the sheet to use it again',
      );
    }
    if (
      current.kind === 'pc' &&
      current.campaignId &&
      current.status === 'inactive'
    ) {
      throw new ConflictException(
        'Inactive Campaign Characters are read-only; reactivate or copy the sheet',
      );
    }
    if (current.kind === 'pc' && current.status === 'active')
      throw new ConflictException(
        'Active Player Characters must be edited through a revision',
      );
    if (current.kind === 'npc' && current.ownerUserId !== userId)
      throw new ForbiddenException('Only the sheet owner can edit this NPC');
    if (current.kind === 'npc' && current.status === 'archived')
      throw new ConflictException('Archived Campaign NPCs are read-only');
    if (body.imageAssetId !== undefined)
      await this.ensureOwnedImageAsset(userId, body.imageAssetId);
    const attributes = this.getAttributes({
      ...body,
      agility: body.agility ?? current.agility,
      strength: body.strength ?? current.strength,
      intellect: body.intellect ?? current.intellect,
      presence: body.presence ?? current.presence,
      vigor: body.vigor ?? current.vigor,
    });
    const nex = body.nex ?? current.nex;
    const characterClass = body.characterClass ?? current.characterClass;
    if (current.kind === 'pc')
      await this.validatePlayerBuild({
        ...body,
        origin: body.origin ?? current.origin,
        characterClass,
        path: body.path ?? current.path,
        nex,
        attributes,
        status: body.status ?? current.status,
      });
    const derived =
      current.kind === 'pc'
        ? await this.getDerivedForDraft(
            characterClass,
            nex,
            attributes,
            (body.status ?? current.status) !== 'active',
          )
        : {};
    const [updated] = await this.db
      .update(characters)
      .set({
        name: body.name?.trim() || current.name,
        concept:
          body.concept === undefined
            ? current.concept
            : body.concept?.trim() || null,
        gender:
          body.gender === undefined
            ? current.gender
            : body.gender?.trim() || null,
        age: body.age === undefined ? current.age : body.age,
        appearance:
          body.appearance === undefined
            ? current.appearance
            : body.appearance?.trim() || null,
        personality:
          body.personality === undefined
            ? current.personality
            : body.personality?.trim() || null,
        history:
          body.history === undefined
            ? current.history
            : body.history?.trim() || null,
        objective:
          body.objective === undefined
            ? current.objective
            : body.objective?.trim() || null,
        playerNotes:
          body.playerNotes === undefined
            ? current.playerNotes
            : body.playerNotes?.trim() || null,
        origin:
          body.origin === undefined
            ? current.origin
            : body.origin?.trim() || null,
        characterClass:
          body.characterClass === undefined
            ? current.characterClass
            : body.characterClass?.trim() || null,
        path:
          body.path === undefined ? current.path : body.path?.trim() || null,
        nex,
        ...attributes,
        ...derived,
        imageAssetId:
          body.imageAssetId === undefined
            ? current.imageAssetId
            : body.imageAssetId,
        status: body.status ?? current.status,
        npcMode:
          current.kind === 'npc'
            ? (body.npcMode ?? current.npcMode)
            : current.npcMode,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(characters.id, characterId))
      .returning();
    if (
      current.kind === 'pc' &&
      (body.skills !== undefined || body.selections !== undefined)
    )
      await this.replaceBuildSelections(characterId, body);
    const nextNpcMode = body.npcMode ?? current.npcMode;
    if (
      current.kind === 'npc' &&
      nextNpcMode === 'threat' &&
      (body.npcStatBlock !== undefined || current.npcMode !== 'threat')
    )
      await this.npcStatBlocksService?.replace(
        characterId,
        body.npcStatBlock ?? {},
        true,
      );
    if (current.kind === 'npc' && nextNpcMode === 'narrative') {
      await this.npcStatBlocksService?.clear(characterId);
      await this.db
        .delete(campaignCharacterStates)
        .where(eq(campaignCharacterStates.characterId, characterId));
    }
    if (
      body.imageAssetId !== undefined &&
      body.imageAssetId !== current.imageAssetId
    ) {
      await this.mediaService.releaseImageIfUnreferenced(
        userId,
        current.imageAssetId,
      );
    }
    return this.toDto(updated);
  }

  async getNpcStatBlock(userId: string, characterId: string) {
    const character = await this.getAccessibleCharacter(userId, characterId);
    if (character.kind !== 'npc')
      throw new BadRequestException('Character is not an NPC');
    await this.ensureManager(userId, character.campaignId);
    if (this.npcStatBlocksService)
      return this.npcStatBlocksService.get(characterId);
    const [[statBlock], attacks, resistances, abilities] = await Promise.all([
      this.db
        .select()
        .from(npcStatBlocks)
        .where(eq(npcStatBlocks.characterId, characterId)),
      this.db
        .select()
        .from(npcAttacks)
        .where(eq(npcAttacks.characterId, characterId)),
      this.db
        .select()
        .from(npcResistances)
        .where(eq(npcResistances.characterId, characterId)),
      this.db
        .select()
        .from(npcAbilities)
        .where(eq(npcAbilities.characterId, characterId)),
    ]);
    return { statBlock: statBlock ?? null, attacks, resistances, abilities };
  }

  getRuleset() {
    return this.rulesService.getCatalog(DEFAULT_RULESET_VERSION);
  }

  async validatePlayerCharacter(
    body: CharacterInput,
  ): Promise<{ valid: true }> {
    await this.validatePlayerBuild({
      ...body,
      nex: body.nex ?? 5,
      attributes: this.getAttributes(body),
      status: 'active',
    });
    return { valid: true };
  }

  async copyCharacter(
    userId: string,
    characterId: string,
  ): Promise<CharacterDto> {
    const source = await this.getAccessibleCharacter(userId, characterId);
    if (source.ownerUserId !== userId) {
      throw new ForbiddenException(
        'Only the sheet owner can copy a character',
      );
    }
    const now = new Date().toISOString();
    const copy = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(characters)
        .values({
          ownerUserId: userId,
          sourceCharacterId: source.id,
          kind: source.kind,
          // A copy is deliberately unassigned. Campaign state and inventory never
          // cross this boundary.
          campaignId: null,
          status: 'draft',
          npcMode: source.npcMode,
          rulesetVersion: source.rulesetVersion,
          name: source.name,
          concept: source.concept,
          gender: source.gender,
          age: source.age,
          appearance: source.appearance,
          personality: source.personality,
          history: source.history,
          objective: source.objective,
          playerNotes: source.playerNotes,
          origin: source.origin,
          characterClass: source.characterClass,
          path: source.path,
          nex: source.nex,
          agility: source.agility,
          strength: source.strength,
          intellect: source.intellect,
          presence: source.presence,
          vigor: source.vigor,
          maxHp: source.maxHp,
          maxSan: source.maxSan,
          maxEp: source.maxEp,
          epLimit: source.epLimit,
          defense: source.defense,
          dodge: source.dodge,
          block: source.block,
          movement: source.movement,
          carryCapacity: source.carryCapacity,
          imageAssetId: source.imageAssetId,
          updatedAt: now,
        })
        .returning();
      const [skills, powers] = await Promise.all([
        tx
          .select()
          .from(characterSkills)
          .where(eq(characterSkills.characterId, source.id)),
        tx
          .select()
          .from(characterSelections)
          .where(
            and(
              eq(characterSelections.characterId, source.id),
              eq(characterSelections.category, 'power'),
            ),
          ),
      ]);
      if (skills.length)
        await tx.insert(characterSkills).values(
          skills.map(({ id: _id, characterId: _characterId, ...skill }) => ({
            ...skill,
            characterId: created.id,
          })),
        );
      if (powers.length)
        await tx.insert(characterSelections).values(
          powers.map(
            ({ id: _id, characterId: _characterId, ...selection }) => ({
              ...selection,
              characterId: created.id,
            }),
          ),
        );
      if (source.kind === 'npc') {
        const [[block], attacks, resistances, abilities] = await Promise.all([
          tx.select().from(npcStatBlocks).where(eq(npcStatBlocks.characterId, source.id)),
          tx.select().from(npcAttacks).where(eq(npcAttacks.characterId, source.id)),
          tx.select().from(npcResistances).where(eq(npcResistances.characterId, source.id)),
          tx.select().from(npcAbilities).where(eq(npcAbilities.characterId, source.id)),
        ]);
        if (block) await tx.insert(npcStatBlocks).values({ ...block, characterId: created.id, updatedAt: now });
        if (attacks.length) await tx.insert(npcAttacks).values(attacks.map(({ id: _id, characterId: _characterId, ...entry }) => ({ ...entry, characterId: created.id })));
        if (resistances.length) await tx.insert(npcResistances).values(resistances.map(({ id: _id, characterId: _characterId, ...entry }) => ({ ...entry, characterId: created.id })));
        if (abilities.length) await tx.insert(npcAbilities).values(abilities.map(({ id: _id, characterId: _characterId, ...entry }) => ({ ...entry, characterId: created.id })));
      }
      return created;
    });
    return this.toDto(copy);
  }

  async archiveCharacter(userId: string, characterId: string): Promise<void> {
    const current = await this.getAccessibleCharacter(userId, characterId);
    if (current.kind === 'npc') {
      await this.ensureManager(userId, current.campaignId);
      if (current.status === 'archived') return;
      const now = new Date().toISOString();
      await this.db
        .update(characters)
        .set({
          status: 'archived',
          frozenAt: now,
          statusChangedAt: now,
          updatedAt: now,
        })
        .where(eq(characters.id, characterId));
      return;
    }
    if (current.kind !== 'pc' || current.ownerUserId !== userId) {
      throw new ForbiddenException(
        'Only the sheet owner can archive a Player Character',
      );
    }
    if (current.campaignId)
      throw new ConflictException(
        'Campaign Characters can only be archived by the GM',
      );
    const now = new Date().toISOString();
    const [draft] = await this.db.transaction(async (tx) => {
      await tx
        .update(characters)
        .set({
          status: 'archived',
          frozenAt: now,
          statusChangedAt: now,
          updatedAt: now,
        })
        .where(eq(characters.id, characterId));
      return tx
        .delete(characterEditDrafts)
        .where(eq(characterEditDrafts.characterId, characterId))
        .returning();
    });
    if (draft)
      await this.mediaService.releaseImageIfUnreferenced(
        userId,
        draft.imageAssetId,
      );
  }

  async updateCampaignState(
    userId: string,
    characterId: string,
    body: unknown,
  ): Promise<CampaignPlayStateDto> {
    const character = await this.getAccessibleCharacter(userId, characterId);
    await this.ensureCanEditCampaignState(userId, character);
    const maximums = await this.getCampaignResourceMaximums(character);
    const applicableResources = this.getApplicableCampaignResources(character);
    const patch = normalizeCampaignStatePatch(
      parseCampaignStatePatch(
        body,
        applicableResources,
        character.kind === 'pc',
      ),
      maximums,
    );
    const now = new Date().toISOString();
    const insertState = {
      characterId,
      currentHp: patch.currentHp ?? maximums.currentHp,
      currentSan: patch.currentSan ?? maximums.currentSan,
      currentEp: patch.currentEp ?? maximums.currentEp,
      conditions: patch.conditions ?? '',
      temporaryEffects: patch.temporaryEffects ?? '',
      updatedAt: now,
    };
    const updateState = {
      updatedAt: now,
      ...(patch.currentHp !== undefined ? { currentHp: patch.currentHp } : {}),
      ...(patch.currentSan !== undefined
        ? { currentSan: patch.currentSan }
        : {}),
      ...(patch.currentEp !== undefined ? { currentEp: patch.currentEp } : {}),
      ...(patch.conditions !== undefined
        ? { conditions: patch.conditions }
        : {}),
      ...(patch.temporaryEffects !== undefined
        ? { temporaryEffects: patch.temporaryEffects }
        : {}),
    };
    await this.db
      .insert(campaignCharacterStates)
      .values(insertState)
      .onConflictDoUpdate({
        target: campaignCharacterStates.characterId,
        set: updateState,
      });
    return this.getCampaignPlayState(userId, characterId);
  }

  async getCampaignPlayState(
    userId: string,
    characterId: string,
  ): Promise<CampaignPlayStateDto> {
    const character = await this.getAccessibleCharacter(userId, characterId);
    if (character.kind === 'npc' && character.npcMode !== 'threat')
      throw new BadRequestException('Narrative NPCs do not have play state');
    if (!character.campaignId)
      throw new BadRequestException('Character is not in a campaign');
    await this.ensureCanAccessCampaignState(userId, character);
    const maximums = await this.getCampaignResourceMaximums(character);
    const [[state], inventory, ritualRows, catalog] = await Promise.all([
      this.db
        .select()
        .from(campaignCharacterStates)
        .where(eq(campaignCharacterStates.characterId, characterId)),
      character.kind === 'pc'
        ? this.db
            .select()
            .from(characterInventory)
            .where(eq(characterInventory.characterId, characterId))
        : Promise.resolve([]),
      character.kind === 'pc'
        ? this.db
            .select()
            .from(campaignCharacterRituals)
            .where(eq(campaignCharacterRituals.characterId, characterId))
        : Promise.resolve([]),
      character.kind === 'pc'
        ? this.rulesService.getCatalog(character.rulesetVersion)
        : Promise.resolve(null),
    ]);
    return {
      currentHp: state?.currentHp ?? maximums.currentHp,
      maxHp: maximums.currentHp,
      currentSan:
        character.kind === 'npc'
          ? null
          : (state?.currentSan ?? maximums.currentSan),
      maxSan: character.kind === 'npc' ? null : maximums.currentSan,
      currentEp:
        character.kind === 'npc'
          ? null
          : (state?.currentEp ?? maximums.currentEp),
      maxEp: character.kind === 'npc' ? null : maximums.currentEp,
      conditions: state?.conditions ?? '',
      temporaryEffects: state?.temporaryEffects ?? '',
      gmNotes: state?.gmNotes ?? null,
      updatedAt: state?.updatedAt ?? character.updatedAt,
      rituals: ritualRows.map((ritual) => {
        const option = catalog?.rituals.find(
          (candidate) => candidate.slug === ritual.ritualSlug,
        );
        return {
          slug: ritual.ritualSlug,
          name: option?.name ?? ritual.ritualSlug,
          rank: ritual.rank,
          maxRank: option?.maxRank ?? ritual.rank,
        };
      }),
      inventory: inventory.map((entry) => ({
        id: entry.id,
        itemId: entry.itemId ?? null,
        name: entry.name,
        quantity: entry.quantity,
        isEquipped: entry.isEquipped,
        notes: entry.notes ?? null,
        addedByUserId: entry.addedByUserId ?? null,
        createdAt: entry.createdAt,
      })),
    };
  }

  async putCampaignRitual(
    userId: string,
    characterId: string,
    ritualSlug: string,
    body: { rank?: unknown },
  ): Promise<{ slug: string; name: string; rank: number; maxRank: number }> {
    const character = await this.getAccessibleCharacter(userId, characterId);
    await this.ensureCanManageCampaignRituals(userId, character);
    if (!ritualSlug.trim()) throw new BadRequestException('Ritual is required');
    if (!body || Object.keys(body).length !== 1 || !('rank' in body))
      throw new BadRequestException('A ritual update requires only rank');
    const rank = body.rank;
    if (typeof rank !== 'number' || !Number.isInteger(rank))
      throw new BadRequestException('rank must be an integer');

    const catalog = await this.rulesService.getCatalog(
      character.rulesetVersion,
    );
    const option = this.getValidCampaignRitual(
      catalog,
      character.characterClass,
      character.nex,
      ritualSlug,
      rank,
    );
    await this.db
      .insert(campaignCharacterRituals)
      .values({ characterId, ritualSlug: option.slug, rank })
      .onConflictDoUpdate({
        target: [
          campaignCharacterRituals.characterId,
          campaignCharacterRituals.ritualSlug,
        ],
        set: { rank },
      });
    return {
      slug: option.slug,
      name: option.name,
      rank,
      maxRank: option.maxRank,
    };
  }

  async deleteCampaignRitual(
    userId: string,
    characterId: string,
    ritualSlug: string,
  ): Promise<void> {
    const character = await this.getAccessibleCharacter(userId, characterId);
    await this.ensureCanManageCampaignRituals(userId, character);
    await this.db
      .delete(campaignCharacterRituals)
      .where(
        and(
          eq(campaignCharacterRituals.characterId, characterId),
          eq(campaignCharacterRituals.ritualSlug, ritualSlug),
        ),
      );
  }

  async addInventoryItem(
    userId: string,
    characterId: string,
    body: {
      name: string;
      itemId?: string;
      quantity?: number;
      isEquipped?: boolean;
      notes?: string;
    },
  ): Promise<void> {
    const character = await this.getAccessibleCharacter(userId, characterId);
    if (character.kind !== 'pc') {
      throw new BadRequestException(
        'Only Player Characters have campaign inventory',
      );
    }
    if (character.status !== 'active')
      throw new ConflictException(
        'Only active Campaign Characters can change inventory',
      );
    await this.ensureManager(userId, character.campaignId);
    this.ensureName(body.name);
    if (!Number.isInteger(body.quantity ?? 1) || (body.quantity ?? 1) < 1)
      throw new BadRequestException('Inventory quantity must be at least 1');
    await this.db.insert(characterInventory).values({
      characterId,
      name: body.name.trim(),
      itemId: body.itemId ?? null,
      quantity: body.quantity ?? 1,
      isEquipped: body.isEquipped ?? false,
      notes: body.notes?.trim() || null,
      addedByUserId: userId,
    });
  }

  async removeInventoryItem(
    userId: string,
    characterId: string,
    inventoryId: string,
  ): Promise<void> {
    const character = await this.getAccessibleCharacter(userId, characterId);
    if (character.kind !== 'pc') {
      throw new BadRequestException(
        'Only Player Characters have campaign inventory',
      );
    }
    if (character.status !== 'active')
      throw new ConflictException(
        'Only active Campaign Characters can change inventory',
      );
    await this.ensureManager(userId, character.campaignId);
    const deleted = await this.db
      .delete(characterInventory)
      .where(
        and(
          eq(characterInventory.id, inventoryId),
          eq(characterInventory.characterId, characterId),
        ),
      )
      .returning({ id: characterInventory.id });
    if (!deleted.length)
      throw new NotFoundException('Inventory entry not found');
  }

  private async getAccessibleCharacter(userId: string, characterId: string) {
    const [row] = await this.db
      .select()
      .from(characters)
      .where(and(eq(characters.id, characterId), isNull(characters.deletedAt)));
    if (!row) throw new NotFoundException('Character not found');
    if (
      row.ownerUserId === userId ||
      (row.campaignId && (await this.canAccessCampaign(userId, row.campaignId)))
    )
      return row;
    throw new NotFoundException('Character not found');
  }

  private ensureCanEditActivePlayerCharacter(
    userId: string,
    character: typeof characters.$inferSelect,
  ): void {
    if (character.kind !== 'pc' || character.ownerUserId !== userId)
      throw new ForbiddenException(
        'Only the sheet owner can edit a Player Character',
      );
    if (character.status === 'archived')
      throw new ConflictException('Archived sheets are read-only');
    if (character.status !== 'active')
      throw new ConflictException(
        'Only active Player Characters use revisions',
      );
  }

  private async canAccessCampaign(
    userId: string,
    campaignId: string,
  ): Promise<boolean> {
    try {
      await this.campaignsService.getCampaign(userId, campaignId);
      return true;
    } catch {
      return false;
    }
  }

  private async ensureManager(
    userId: string,
    campaignId: string | null,
  ): Promise<void> {
    if (!campaignId) throw new BadRequestException('A campaign is required');
    const campaign = await this.campaignsService.getCampaign(
      userId,
      campaignId,
    );
    if (campaign.ownerUserId !== userId)
      throw new ForbiddenException(
        'Only the campaign owner can manage this campaign character',
      );
  }

  private async isCampaignManager(
    userId: string,
    campaignId: string,
  ): Promise<boolean> {
    try {
      await this.ensureManager(userId, campaignId);
      return true;
    } catch {
      return false;
    }
  }

  private async ensureCanAccessCampaignState(
    userId: string,
    character: typeof characters.$inferSelect,
  ): Promise<void> {
    if (!(await this.canViewCampaignState(userId, character)))
      throw new ForbiddenException('Cannot access this campaign play state');
  }

  private async ensureCanEditCampaignState(
    userId: string,
    character: typeof characters.$inferSelect,
  ): Promise<void> {
    if (!character.campaignId)
      throw new BadRequestException('Character is not in a campaign');
    if (character.kind === 'pc') {
      if (character.ownerUserId !== userId)
        throw new ForbiddenException(
          'Only the sheet owner can edit campaign state',
        );
      if (character.status !== 'active')
        throw new ConflictException(
          'Only active Campaign Characters can change campaign state',
        );
      if (!(await this.hasCampaignMembership(userId, character.campaignId)))
        throw new ForbiddenException(
          'Join the campaign to edit campaign state',
        );
      return;
    }
    if (character.npcMode !== 'threat')
      throw new BadRequestException('Narrative NPCs do not have play state');
    await this.ensureManager(userId, character.campaignId);
    if (character.status !== 'active')
      throw new ConflictException(
        'Only active Campaign NPCs can change campaign state',
      );
  }

  private async ensureCanManageCampaignRituals(
    userId: string,
    character: typeof characters.$inferSelect,
  ): Promise<void> {
    if (character.kind !== 'pc' || !character.campaignId)
      throw new BadRequestException(
        'Only Campaign Characters can manage campaign rituals',
      );
    if (character.ownerUserId !== userId)
      throw new ForbiddenException(
        'Only the sheet owner can manage campaign rituals',
      );
    if (character.status !== 'active')
      throw new ConflictException(
        'Only active Campaign Characters can manage campaign rituals',
      );
    if (!(await this.hasCampaignMembership(userId, character.campaignId)))
      throw new ForbiddenException('Join the campaign to manage rituals');
  }

  private getApplicableCampaignResources(
    character: typeof characters.$inferSelect,
  ): CampaignResourceKey[] {
    return character.kind === 'pc'
      ? ['currentHp', 'currentSan', 'currentEp']
      : ['currentHp'];
  }

  private async getCampaignResourceMaximums(
    character: typeof characters.$inferSelect,
  ): Promise<CampaignResourceMaximums> {
    if (character.kind === 'pc')
      return {
        currentHp: character.maxHp ?? 0,
        currentSan: character.maxSan ?? 0,
        currentEp: character.maxEp ?? 0,
      };
    const [statBlock] = await this.db
      .select({ hp: npcStatBlocks.hp })
      .from(npcStatBlocks)
      .where(eq(npcStatBlocks.characterId, character.id));
    if (!statBlock)
      throw new ConflictException('Threat NPC does not have a stat block');
    return { currentHp: statBlock.hp, currentSan: 0, currentEp: 0 };
  }

  private async hasCampaignMembership(
    userId: string,
    campaignId: string,
  ): Promise<boolean> {
    const [membership] = await this.db
      .select({ userId: campaignMembers.userId })
      .from(campaignMembers)
      .where(
        and(
          eq(campaignMembers.campaignId, campaignId),
          eq(campaignMembers.userId, userId),
        ),
      );
    return Boolean(membership);
  }

  private async canViewCampaignState(
    userId: string,
    character: typeof characters.$inferSelect,
  ): Promise<boolean> {
    if (!character.campaignId) return false;
    if (character.kind === 'npc')
      return (
        character.npcMode === 'threat' &&
        (await this.isCampaignManager(userId, character.campaignId))
      );
    if (await this.isCampaignManager(userId, character.campaignId!))
      return true;
    if (character.status !== 'active' || character.ownerUserId !== userId)
      return false;
    return this.hasCampaignMembership(userId, character.campaignId);
  }

  private getCampaignRitualConflict(
    catalog: RulesetCatalog,
    characterClass: string | null,
    nex: number,
    ritualSlug: string,
    rank: number,
  ): { message: string } | null {
    const ritual = catalog.rituals.find((option) => option.slug === ritualSlug);
    if (!ritual) return { message: `Ritual inválido: ${ritualSlug}` };
    if (ritual.minNex > nex)
      return { message: `O ritual ${ritual.name} exige NEX ${ritual.minNex}%` };
    if (ritual.requiredClassSlug && ritual.requiredClassSlug !== characterClass)
      return {
        message: `O ritual ${ritual.name} exige a classe ${ritual.requiredClassSlug}`,
      };
    if (!Number.isInteger(rank) || rank < 1 || rank > ritual.maxRank)
      return {
        message: `O grau de ${ritual.name} deve ser de 1 a ${ritual.maxRank}`,
      };
    return null;
  }

  private getValidCampaignRitual(
    catalog: RulesetCatalog,
    characterClass: string | null,
    nex: number,
    ritualSlug: string,
    rank: number,
  ) {
    const conflict = this.getCampaignRitualConflict(
      catalog,
      characterClass,
      nex,
      ritualSlug,
      rank,
    );
    if (conflict) throw new BadRequestException(conflict.message);
    const ritual = catalog.rituals.find((option) => option.slug === ritualSlug);
    if (!ritual) throw new BadRequestException('Ritual inválido');
    return ritual;
  }

  private async getCampaignRitualConflicts(
    characterId: string,
    catalog: RulesetCatalog,
    characterClass: string | null,
    nex: number,
  ): Promise<CharacterEditDraftDto['conflicts']> {
    const rituals = await this.db
      .select()
      .from(campaignCharacterRituals)
      .where(eq(campaignCharacterRituals.characterId, characterId));
    return rituals.flatMap((ritual) => {
      const conflict = this.getCampaignRitualConflict(
        catalog,
        characterClass,
        nex,
        ritual.ritualSlug,
        ritual.rank,
      );
      return conflict
        ? [
            {
              code: 'INVALID_CAMPAIGN_RITUAL',
              field: 'rituals',
              optionId: ritual.ritualSlug,
              message: conflict.message,
            },
          ]
        : [];
    });
  }

  private ensureName(name: string | undefined): asserts name is string {
    if (!name?.trim())
      throw new BadRequestException('Character name is required');
  }

  private async ensureOwnedImageAsset(
    userId: string,
    assetId: string | null | undefined,
  ): Promise<void> {
    if (!assetId) return;
    const [asset] = await this.db
      .select({
        ownerUserId: mediaAssets.ownerUserId,
        deletedAt: mediaAssets.deletedAt,
        kind: mediaAssets.kind,
      })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, assetId));
    if (
      !asset ||
      asset.deletedAt ||
      asset.kind !== 'image' ||
      asset.ownerUserId !== userId
    ) {
      throw new BadRequestException('Choose an image uploaded by this user');
    }
  }

  private getAttributes(
    input: Partial<CharacterInput> & {
      agility?: number;
      strength?: number;
      intellect?: number;
      presence?: number;
      vigor?: number;
    },
  ) {
    return {
      agility: input.agility ?? 1,
      strength: input.strength ?? 1,
      intellect: input.intellect ?? 1,
      presence: input.presence ?? 1,
      vigor: input.vigor ?? 1,
    };
  }

  private async validatePlayerBuild(
    input: CharacterInput & {
      nex: number;
      attributes: {
        agility: number;
        strength: number;
        intellect: number;
        presence: number;
        vigor: number;
      };
    },
  ): Promise<void> {
    const catalog = await this.rulesService.getCatalog(DEFAULT_RULESET_VERSION);
    validateBuild(catalog, {
      origin: input.origin,
      characterClass: input.characterClass,
      path: input.path,
      nex: input.nex,
      attributes: input.attributes,
      skills: input.skills,
      selections: input.selections,
      isFinal: input.status === 'active',
    });
  }

  private async getDerivedForDraft(
    characterClass: string | null | undefined,
    nex: number,
    attributes: {
      agility: number;
      strength: number;
      intellect: number;
      presence: number;
      vigor: number;
    },
    tolerateInvalid = false,
  ) {
    if (!characterClass)
      return {
        maxHp: null,
        maxSan: null,
        maxEp: null,
        epLimit: null,
        defense: null,
        dodge: null,
        block: null,
        movement: null,
        carryCapacity: null,
      };
    try {
      return calculateDerived(
        await this.rulesService.getCatalog(DEFAULT_RULESET_VERSION),
        characterClass,
        nex,
        attributes,
      );
    } catch (error) {
      if (!tolerateInvalid) throw error;
      return {
        maxHp: null,
        maxSan: null,
        maxEp: null,
        epLimit: null,
        defense: null,
        dodge: null,
        block: null,
        movement: null,
        carryCapacity: null,
      };
    }
  }

  private async replaceBuildSelections(
    characterId: string,
    body: CharacterInput,
  ): Promise<void> {
    if (body.skills !== undefined) {
      await this.db
        .delete(characterSkills)
        .where(eq(characterSkills.characterId, characterId));
      if (body.skills.length)
        await this.db.insert(characterSkills).values(
          body.skills.map((skill) => ({
            characterId,
            name: skill.name,
            degree: skill.degree ?? 'trained',
          })),
        );
    }
    if (body.selections !== undefined) {
      await this.db
        .delete(characterSelections)
        .where(eq(characterSelections.characterId, characterId));
      if (body.selections.length)
        await this.db.insert(characterSelections).values(
          body.selections.map((selection) => ({
            characterId,
            category: selection.category,
            name: selection.name,
            rank: selection.rank ?? 1,
          })),
        );
    }
  }

  private async replaceNpcStatBlock(
    characterId: string,
    input: NpcStatBlockInput,
  ): Promise<void> {
    const numbers = {
      threatLevel: input.threatLevel ?? 0,
      hp: input.hp ?? 1,
      defense: input.defense ?? 10,
      fortitude: input.fortitude ?? 0,
      reflex: input.reflex ?? 0,
      will: input.will ?? 0,
      perception: input.perception ?? 0,
      movement: input.movement ?? 9,
    };
    for (const [key, value] of Object.entries(numbers)) {
      if (!Number.isInteger(value) || value < 0)
        throw new BadRequestException(`${key} must be a non-negative integer`);
    }
    const size = input.size?.trim() || 'medium';
    await this.db
      .insert(npcStatBlocks)
      .values({
        characterId,
        ...numbers,
        size,
        senses: input.senses?.trim() || null,
        notes: input.notes?.trim() || null,
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: npcStatBlocks.characterId,
        set: {
          ...numbers,
          size,
          senses: input.senses?.trim() || null,
          notes: input.notes?.trim() || null,
          updatedAt: new Date().toISOString(),
        },
      });
    await Promise.all([
      this.db.delete(npcAttacks).where(eq(npcAttacks.characterId, characterId)),
      this.db
        .delete(npcResistances)
        .where(eq(npcResistances.characterId, characterId)),
      this.db
        .delete(npcAbilities)
        .where(eq(npcAbilities.characterId, characterId)),
    ]);
    const attacks = input.attacks ?? [];
    const resistances = input.resistances ?? [];
    const abilities = input.abilities ?? [];
    if (attacks.some((attack) => !attack.name.trim()))
      throw new BadRequestException('NPC attacks require a name');
    const normalizedResistances = resistances.map((entry) => ({
      damageType: (entry.damageType ?? entry.type ?? '').trim(),
      value:
        typeof entry.value === 'string'
          ? Number(entry.value)
          : (entry.value ?? 0),
      kind: entry.kind ?? 'resistance',
    }));
    if (
      normalizedResistances.some(
        (entry) => !entry.damageType || !Number.isInteger(entry.value),
      )
    )
      throw new BadRequestException(
        'NPC resistances require a type and integer value',
      );
    if (
      abilities.some(
        (ability) => !ability.name.trim() || !ability.description.trim(),
      )
    )
      throw new BadRequestException(
        'NPC abilities require a name and description',
      );
    if (attacks.length)
      await this.db.insert(npcAttacks).values(
        attacks.map((attack, sortOrder) => ({
          characterId,
          name: attack.name.trim(),
          test: attack.test?.trim() || null,
          damage: attack.damage?.trim() || null,
          range: attack.range?.trim() || null,
          critical: attack.critical?.trim() || null,
          effect: attack.effect?.trim() || null,
          sortOrder,
        })),
      );
    if (normalizedResistances.length)
      await this.db
        .insert(npcResistances)
        .values(
          normalizedResistances.map((entry) => ({ characterId, ...entry })),
        );
    if (abilities.length)
      await this.db.insert(npcAbilities).values(
        abilities.map((ability, sortOrder) => ({
          characterId,
          name: ability.name.trim(),
          description: ability.description.trim(),
          actionCost: ability.actionCost?.trim() || null,
          sortOrder,
        })),
      );
  }

  private toDto(
    row: typeof characters.$inferSelect,
    includeOwnerMetadata = true,
  ): CharacterDto {
    return {
      id: row.id,
      campaignId: row.campaignId ?? null,
      campaignName: null,
      campaignAttachedAt: row.campaignAttachedAt ?? null,
      statusChangedAt: row.statusChangedAt,
      archiveReason: row.archiveReason ?? null,
      ownerUserId: row.ownerUserId ?? null,
      sourceCharacterId: includeOwnerMetadata
        ? (row.sourceCharacterId ?? null)
        : null,
      kind: row.kind,
      status: row.status,
      npcMode: row.npcMode ?? null,
      rulesetVersion: row.rulesetVersion,
      name: row.name,
      concept: row.concept ?? null,
      gender: row.gender ?? null,
      age: row.age ?? null,
      appearance: row.appearance ?? null,
      personality: row.personality ?? null,
      history: row.history ?? null,
      objective: row.objective ?? null,
      playerNotes: includeOwnerMetadata ? (row.playerNotes ?? null) : null,
      origin: row.origin ?? null,
      characterClass: row.characterClass ?? null,
      path: row.path ?? null,
      nex: row.nex,
      attributes: {
        agility: row.agility,
        strength: row.strength,
        intellect: row.intellect,
        presence: row.presence,
        vigor: row.vigor,
      },
      skills: [],
      powers: [],
      derived: {
        maxHp: row.maxHp ?? null,
        maxSan: row.maxSan ?? null,
        maxEp: row.maxEp ?? null,
        epLimit: row.epLimit ?? null,
        defense: row.defense ?? null,
        dodge: row.dodge ?? null,
        block: row.block ?? null,
        movement: row.movement ?? null,
        carryCapacity: row.carryCapacity ?? null,
      },
      imageAssetId: row.imageAssetId ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      permissions: {
        canCopy: false,
        canViewCampaignState: false,
        canEditPermanentData: false,
        canEditPlayState: false,
        canManageRituals: false,
        canManageInventory: false,
      },
      hasEditDraft: false,
    };
  }

  private async getCharacterDto(
    row: typeof characters.$inferSelect,
    includeOwnerMetadata: boolean,
    userId?: string,
  ): Promise<CharacterDto> {
    const [skills, selections] = await Promise.all([
      this.db
        .select({ name: characterSkills.name, degree: characterSkills.degree })
        .from(characterSkills)
        .where(eq(characterSkills.characterId, row.id))
        .orderBy(asc(characterSkills.name)),
      this.db
        .select({
          category: characterSelections.category,
          name: characterSelections.name,
          rank: characterSelections.rank,
        })
        .from(characterSelections)
        .where(eq(characterSelections.characterId, row.id))
        .orderBy(asc(characterSelections.name)),
    ]);
    const [draft] = await this.db
      .select({ id: characterEditDrafts.id })
      .from(characterEditDrafts)
      .where(eq(characterEditDrafts.characterId, row.id));
    const isOwner = row.ownerUserId === userId;
    const [campaign] = row.campaignId
      ? await this.db
          .select({ name: campaigns.name })
          .from(campaigns)
          .where(eq(campaigns.id, row.campaignId))
      : [];
    let canManageInventory = false;
    let isCampaignManager = false;
    if (row.campaignId && userId) {
      try {
        await this.ensureManager(userId, row.campaignId);
        isCampaignManager = true;
        canManageInventory = row.kind === 'pc' && row.status === 'active';
      } catch {
        /* no inventory permission */
      }
    }
    const dto = this.toDto(row, includeOwnerMetadata);
    const canViewCampaignState =
      Boolean(row.campaignId) && userId
        ? await this.canViewCampaignState(userId, row)
        : false;
    return {
      ...dto,
      campaignName: campaign?.name ?? null,
      skills,
      powers: selections
        .filter((selection) => selection.category === 'power')
        .map(({ name, rank }) => ({ name, rank })),
      permissions: {
        canCopy: isOwner && row.kind === 'pc',
        canViewCampaignState,
        canEditPermanentData:
          (isOwner && row.kind === 'pc' && row.status === 'active') ||
          (isCampaignManager && row.kind === 'npc' && row.status === 'active'),
        canEditPlayState:
          row.status === 'active' &&
          ((isOwner && row.kind === 'pc' && canViewCampaignState) ||
            (isCampaignManager &&
              row.kind === 'npc' &&
              row.npcMode === 'threat')),
        canManageRituals:
          isOwner &&
          row.kind === 'pc' &&
          canViewCampaignState &&
          row.status === 'active',
        canManageInventory,
      },
      hasEditDraft: Boolean(draft),
    };
  }

  private async getEditDraftDto(
    draft: typeof characterEditDrafts.$inferSelect,
  ): Promise<CharacterEditDraftDto> {
    const [skills, powers, catalog] = await Promise.all([
      this.db
        .select({
          name: characterEditDraftSkills.name,
          degree: characterEditDraftSkills.degree,
        })
        .from(characterEditDraftSkills)
        .where(eq(characterEditDraftSkills.draftId, draft.id)),
      this.db
        .select({
          name: characterEditDraftPowers.name,
          rank: characterEditDraftPowers.rank,
        })
        .from(characterEditDraftPowers)
        .where(eq(characterEditDraftPowers.draftId, draft.id)),
      this.rulesService.getCatalog(draft.rulesetVersion),
    ]);
    const attributes = {
      agility: draft.agility,
      strength: draft.strength,
      intellect: draft.intellect,
      presence: draft.presence,
      vigor: draft.vigor,
    };
    const selections = powers.map((power) => ({
      category: 'power' as const,
      name: power.name,
      rank: power.rank,
    }));
    const conflicts = analyzeBuild(catalog, {
      origin: draft.origin,
      characterClass: draft.characterClass,
      path: draft.path,
      nex: draft.nex,
      attributes,
      skills,
      selections,
      isFinal: true,
    });
    let derived: CharacterDto['derived'] = {
      maxHp: null,
      maxSan: null,
      maxEp: null,
      epLimit: null,
      defense: null,
      dodge: null,
      block: null,
      movement: null,
      carryCapacity: null,
    };
    try {
      derived = calculateDerived(
        catalog,
        draft.characterClass ?? '',
        draft.nex,
        attributes,
      );
    } catch {
      /* conflicts provide the actionable reason */
    }
    return {
      id: draft.id,
      characterId: draft.characterId,
      rulesetVersion: draft.rulesetVersion,
      name: draft.name,
      concept: draft.concept ?? null,
      gender: draft.gender ?? null,
      age: draft.age ?? null,
      appearance: draft.appearance ?? null,
      personality: draft.personality ?? null,
      history: draft.history ?? null,
      objective: draft.objective ?? null,
      playerNotes: draft.playerNotes ?? null,
      origin: draft.origin ?? null,
      characterClass: draft.characterClass ?? null,
      path: draft.path ?? null,
      nex: draft.nex,
      attributes,
      imageAssetId: draft.imageAssetId ?? null,
      skills,
      powers,
      derived,
      conflicts,
      updatedAt: draft.updatedAt,
    };
  }
}
