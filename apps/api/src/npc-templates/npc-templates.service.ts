import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import { characters, mediaAssets } from '../database/schema';
import { MediaService } from '../media/media.service';
import type { NpcStatBlockInput } from '../characters/characters.service';
import { NpcStatBlocksService } from '../characters/npc-stat-blocks.service';

export type NpcTemplateInput = Partial<{
  name: string;
  concept: string | null;
  appearance: string | null;
  personality: string | null;
  history: string | null;
  objective: string | null;
  playerNotes: string | null;
  npcMode: 'narrative' | 'threat';
  imageAssetId: string | null;
  agility: number;
  strength: number;
  intellect: number;
  presence: number;
  vigor: number;
  npcStatBlock: NpcStatBlockInput;
}>;

@Injectable()
export class NpcTemplatesService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly mediaService: MediaService,
    private readonly statBlocks: NpcStatBlocksService,
  ) {}

  async list(userId: string) {
    const rows = await this.db
      .select()
      .from(characters)
      .where(
        and(
          eq(characters.ownerUserId, userId),
          eq(characters.kind, 'npc'),
          isNull(characters.campaignId),
          isNull(characters.deletedAt),
        ),
      )
      .orderBy(desc(characters.updatedAt));
    return rows.map((row) => this.summary(row));
  }

  async create(userId: string, input: NpcTemplateInput) {
    return this.persist(userId, input, 'active');
  }
  async createDraft(userId: string, input: NpcTemplateInput) {
    return this.persist(userId, input, 'draft');
  }

  async get(userId: string, templateId: string) {
    const row = await this.findOwned(userId, templateId);
    return {
      ...this.detail(row),
      npcStatBlock:
        row.npcMode === 'threat' ? await this.statBlocks.get(row.id) : null,
    };
  }

  async update(userId: string, templateId: string, input: NpcTemplateInput) {
    const current = await this.findOwned(userId, templateId);
    return this.updatePersist(userId, current, input, 'active');
  }
  async saveDraft(userId: string, templateId: string, input: NpcTemplateInput) {
    const current = await this.findOwned(userId, templateId);
    if (current.status !== 'draft')
      throw new BadRequestException('Only drafts can be auto-saved');
    return this.updatePersist(userId, current, input, 'draft');
  }
  async publish(userId: string, templateId: string) {
    const current = await this.findOwned(userId, templateId);
    if (current.status !== 'draft')
      throw new BadRequestException('Only drafts can be published');
    this.validateComplete({
      name: current.name,
      npcMode: current.npcMode ?? 'narrative',
    });
    const [row] = await this.db
      .update(characters)
      .set({ status: 'active', updatedAt: new Date().toISOString() })
      .where(eq(characters.id, current.id))
      .returning();
    return this.detail(row);
  }
  async remove(userId: string, templateId: string): Promise<void> {
    const current = await this.findOwned(userId, templateId);
    await this.db.transaction(async (tx) => {
      await tx
        .update(characters)
        .set({
          imageAssetId: null,
          deletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(characters.id, current.id));
    });
    await this.mediaService.releaseImageIfUnreferenced(
      userId,
      current.imageAssetId,
    );
  }

  private async persist(
    userId: string,
    input: NpcTemplateInput,
    status: 'draft' | 'active',
  ) {
    if (status === 'active') this.validateComplete(input);
    await this.ensureOwnedImage(userId, input.imageAssetId);
    const mode = input.npcMode ?? 'narrative';
    const [row] = await this.db
      .insert(characters)
      .values({
        ownerUserId: userId,
        campaignId: null,
        kind: 'npc',
        status,
        npcMode: mode,
        rulesetVersion: 'op-rpg-1.3',
        name: input.name?.trim() || 'Untitled NPC',
        concept: this.clean(input.concept),
        appearance: this.clean(input.appearance),
        personality: this.clean(input.personality),
        history: this.clean(input.history),
        objective: this.clean(input.objective),
        playerNotes: this.clean(input.playerNotes),
        imageAssetId: input.imageAssetId ?? null,
        ...this.attributes(input),
      })
      .returning();
    if (mode === 'threat')
      await this.statBlocks.replace(row.id, input.npcStatBlock ?? {});
    return this.detail(row);
  }
  private async updatePersist(
    userId: string,
    current: typeof characters.$inferSelect,
    input: NpcTemplateInput,
    status: 'draft' | 'active',
  ) {
    const next = {
      ...current,
      ...input,
      npcMode: input.npcMode ?? current.npcMode ?? 'narrative',
      name: input.name ?? current.name,
    };
    if (status === 'active')
      this.validateComplete({
        name: next.name,
        npcMode: next.npcMode ?? undefined,
      });
    if (input.imageAssetId !== undefined)
      await this.ensureOwnedImage(userId, input.imageAssetId);
    const [row] = await this.db
      .update(characters)
      .set({
        name: next.name.trim() || current.name,
        concept:
          input.concept === undefined
            ? current.concept
            : this.clean(input.concept),
        appearance:
          input.appearance === undefined
            ? current.appearance
            : this.clean(input.appearance),
        personality:
          input.personality === undefined
            ? current.personality
            : this.clean(input.personality),
        history:
          input.history === undefined
            ? current.history
            : this.clean(input.history),
        objective:
          input.objective === undefined
            ? current.objective
            : this.clean(input.objective),
        playerNotes:
          input.playerNotes === undefined
            ? current.playerNotes
            : this.clean(input.playerNotes),
        npcMode: next.npcMode,
        imageAssetId:
          input.imageAssetId === undefined
            ? current.imageAssetId
            : input.imageAssetId,
        ...this.attributes({ ...current, ...input }),
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(characters.id, current.id))
      .returning();
    if (next.npcMode === 'threat' && input.npcStatBlock !== undefined)
      await this.statBlocks.replace(row.id, input.npcStatBlock);
    if (next.npcMode === 'narrative') await this.statBlocks.clear(row.id);
    if (
      input.imageAssetId !== undefined &&
      input.imageAssetId !== current.imageAssetId
    )
      await this.mediaService.releaseImageIfUnreferenced(
        userId,
        current.imageAssetId,
      );
    return this.detail(row);
  }
  private async findOwned(userId: string, id: string) {
    const [row] = await this.db
      .select()
      .from(characters)
      .where(
        and(
          eq(characters.id, id),
          eq(characters.ownerUserId, userId),
          eq(characters.kind, 'npc'),
          isNull(characters.campaignId),
          isNull(characters.deletedAt),
        ),
      );
    if (!row) throw new NotFoundException('NPC template not found');
    return row;
  }
  private validateComplete(input: NpcTemplateInput): void {
    if (!input.name?.trim())
      throw new BadRequestException('NPC template name is required');
    if (input.npcMode !== 'narrative' && input.npcMode !== 'threat')
      throw new BadRequestException('NPC template mode is required');
  }
  private attributes(
    input:
      | Pick<
          typeof characters.$inferSelect,
          'agility' | 'strength' | 'intellect' | 'presence' | 'vigor'
        >
      | NpcTemplateInput,
  ) {
    const values = {
      agility: input.agility ?? 1,
      strength: input.strength ?? 1,
      intellect: input.intellect ?? 1,
      presence: input.presence ?? 1,
      vigor: input.vigor ?? 1,
    };
    for (const [name, value] of Object.entries(values))
      if (!Number.isInteger(value) || value < 0)
        throw new BadRequestException(`${name} must be a non-negative integer`);
    return values;
  }
  private async ensureOwnedImage(
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
    )
      throw new BadRequestException('Choose an image uploaded by this user');
  }
  private clean(value: string | null | undefined) {
    return value?.trim() || null;
  }
  private summary(row: typeof characters.$inferSelect) {
    return {
      id: row.id,
      name: row.name,
      status: row.status,
      npcMode: row.npcMode ?? 'narrative',
      concept: row.concept ?? null,
      imageAssetId: row.imageAssetId ?? null,
      updatedAt: row.updatedAt,
    };
  }
  private detail(row: typeof characters.$inferSelect) {
    return {
      ...this.summary(row),
      appearance: row.appearance ?? null,
      personality: row.personality ?? null,
      history: row.history ?? null,
      objective: row.objective ?? null,
      playerNotes: row.playerNotes ?? null,
      attributes: {
        agility: row.agility,
        strength: row.strength,
        intellect: row.intellect,
        presence: row.presence,
        vigor: row.vigor,
      },
      createdAt: row.createdAt,
    };
  }
}
