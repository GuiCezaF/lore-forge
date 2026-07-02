import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import { characters, type CharacterKind } from '../database/schema';
import { CampaignsService } from '../campaigns/campaigns.service';

export interface CharacterDto {
  id: string;
  campaignId: string;
  ownerUserId: string | null;
  kind: CharacterKind;
  name: string;
  description?: string | null;
  data: Record<string, unknown>;
  imageAssetId?: string | null;
  frozenAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class CharactersService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly campaignsService: CampaignsService,
  ) {}

  async listMyCharacters(userId: string): Promise<CharacterDto[]> {
    const myCampaigns = await this.campaignsService.listMyCampaigns(userId);
    const campaignIds = myCampaigns.map((campaign) => campaign.id);

    const rows = campaignIds.length
      ? await this.db
          .select()
          .from(characters)
          .where(
            and(
              inArray(characters.campaignId, campaignIds),
              isNull(characters.deletedAt),
            ),
          )
      : [];

    return rows.map((row) => this.toDto(row));
  }

  async createCharacter(
    userId: string,
    body: {
      campaignId: string;
      name: string;
      kind?: CharacterKind;
      description?: string | null;
      data?: Record<string, unknown>;
      imageAssetId?: string | null;
    },
  ): Promise<CharacterDto> {
    if (!body.campaignId || !body.name.trim()) {
      throw new BadRequestException('campaignId and name are required');
    }

    const campaign = await this.campaignsService.getCampaign(
      userId,
      body.campaignId,
    );
    const memberRole = campaign.members?.find(
      (member) => member.userId === userId,
    )?.role;
    const isManager = campaign.ownerUserId === userId || memberRole === 'gm';

    if (body.kind === 'npc' && !isManager) {
      throw new ForbiddenException('Only the GM can create NPCs');
    }

    const [row] = await this.db
      .insert(characters)
      .values({
        campaignId: body.campaignId,
        ownerUserId: userId,
        kind: body.kind ?? 'pc',
        name: body.name.trim(),
        description: body.description?.trim() || null,
        data: body.data ?? {},
        imageAssetId: body.imageAssetId ?? null,
      })
      .returning();

    return this.toDto(row);
  }

  async getCharacter(
    userId: string,
    characterId: string,
  ): Promise<CharacterDto> {
    const row = await this.getAccessibleCharacter(userId, characterId);
    if (!row) {
      throw new NotFoundException('Character not found');
    }
    return this.toDto(row);
  }

  async updateCharacter(
    userId: string,
    characterId: string,
    body: {
      name?: string;
      kind?: CharacterKind;
      description?: string | null;
      data?: Record<string, unknown>;
      imageAssetId?: string | null;
    },
  ): Promise<CharacterDto> {
    const current = await this.getAccessibleCharacter(userId, characterId);
    if (!current) {
      throw new NotFoundException('Character not found');
    }
    if (current.frozenAt) {
      throw new ForbiddenException('Frozen characters cannot be edited');
    }

    const campaign = await this.campaignsService.getCampaign(
      userId,
      current.campaignId,
    );
    const memberRole = campaign.members?.find(
      (member) => member.userId === userId,
    )?.role;
    const canManage = campaign.ownerUserId === userId || memberRole === 'gm';
    const isOwner = current.ownerUserId === userId;

    if (!isOwner && !canManage) {
      throw new ForbiddenException('You cannot edit this character');
    }

    if (body.kind === 'npc' && !canManage) {
      throw new ForbiddenException('Only the GM can turn a sheet into NPC');
    }

    const [updated] = await this.db
      .update(characters)
      .set({
        name: body.name?.trim() ?? current.name,
        kind: body.kind ?? current.kind,
        description:
          body.description === undefined
            ? current.description
            : body.description?.trim() || null,
        data: body.data ?? current.data,
        imageAssetId:
          body.imageAssetId === undefined
            ? current.imageAssetId
            : body.imageAssetId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(characters.id, characterId))
      .returning();

    return this.toDto(updated);
  }

  async deleteCharacter(userId: string, characterId: string): Promise<void> {
    const current = await this.getAccessibleCharacter(userId, characterId);
    if (!current) {
      throw new NotFoundException('Character not found');
    }
    if (current.frozenAt) {
      throw new ForbiddenException('Frozen characters cannot be deleted');
    }

    const campaign = await this.campaignsService.getCampaign(
      userId,
      current.campaignId,
    );
    const memberRole = campaign.members?.find(
      (member) => member.userId === userId,
    )?.role;
    const canManage = campaign.ownerUserId === userId || memberRole === 'gm';
    const isOwner = current.ownerUserId === userId;

    if (!isOwner && !canManage) {
      throw new ForbiddenException('You cannot delete this character');
    }

    await this.db
      .update(characters)
      .set({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(characters.id, characterId));
  }

  async freezeCharactersForUser(userId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db
      .update(characters)
      .set({
        frozenAt: now,
        updatedAt: now,
      })
      .where(eq(characters.ownerUserId, userId));
  }

  private async getAccessibleCharacter(userId: string, characterId: string) {
    const [row] = await this.db
      .select()
      .from(characters)
      .where(and(eq(characters.id, characterId), isNull(characters.deletedAt)));

    if (!row) {
      return null;
    }

    const campaign = await this.campaignsService.getCampaign(
      userId,
      row.campaignId,
    );
    const memberRole = campaign.members?.find(
      (member) => member.userId === userId,
    )?.role;
    const canAccess = campaign.ownerUserId === userId || Boolean(memberRole);

    return canAccess ? row : null;
  }

  private toDto(row: typeof characters.$inferSelect): CharacterDto {
    return {
      id: row.id,
      campaignId: row.campaignId,
      ownerUserId: row.ownerUserId ?? null,
      kind: row.kind,
      name: row.name,
      description: row.description ?? null,
      data: row.data ?? {},
      imageAssetId: row.imageAssetId ?? null,
      frozenAt: row.frozenAt ?? null,
      deletedAt: row.deletedAt ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
