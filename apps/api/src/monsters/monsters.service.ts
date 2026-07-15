import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, isNull, or } from 'drizzle-orm';
import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import { monsters, type EntityScope } from '../database/schema';
import { CampaignsService } from '../campaigns/campaigns.service';

export interface MonsterDto {
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
}

@Injectable()
export class MonstersService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly campaignsService: CampaignsService,
  ) {}

  async listMyMonsters(userId: string): Promise<MonsterDto[]> {
    const campaignIds = (
      await this.campaignsService.listMyCampaigns(userId)
    ).map((campaign) => campaign.id);

    const visibility = [
      eq(monsters.scope, 'system'),
      eq(monsters.ownerUserId, userId),
    ];
    if (campaignIds.length) {
      visibility.push(inArray(monsters.campaignId, campaignIds));
    }

    const rows = await this.db
      .select()
      .from(monsters)
      .where(and(isNull(monsters.deletedAt), or(...visibility)));

    return rows.map((row) => this.toDto(row));
  }

  async createMonster(
    userId: string,
    body: {
      name: string;
      description?: string | null;
      data?: Record<string, unknown>;
      imageAssetId?: string | null;
      scope?: EntityScope;
      campaignId?: string | null;
      sourceMonsterId?: string | null;
    },
  ): Promise<MonsterDto> {
    if (!body.name.trim()) {
      throw new BadRequestException('Monster name is required');
    }
    if (body.scope === 'system') {
      throw new ForbiddenException('System monsters are immutable');
    }
    if (body.scope === 'campaign' && !body.campaignId) {
      throw new BadRequestException(
        'campaignId is required for campaign monsters',
      );
    }

    if (body.scope === 'campaign' && body.campaignId) {
      const campaign = await this.campaignsService.getCampaign(
        userId,
        body.campaignId,
      );
      const canManage = campaign.ownerUserId === userId;
      if (!canManage) {
        throw new ForbiddenException(
          'Only the GM can create campaign monsters',
        );
      }
    }

    const [row] = await this.db
      .insert(monsters)
      .values({
        ownerUserId: userId,
        campaignId:
          body.scope === 'campaign' ? (body.campaignId ?? null) : null,
        sourceMonsterId: body.sourceMonsterId ?? null,
        scope: body.scope ?? 'user',
        name: body.name.trim(),
        description: body.description?.trim() || null,
        data: body.data ?? {},
        imageAssetId: body.imageAssetId ?? null,
        locked: false,
      })
      .returning();

    return this.toDto(row);
  }

  async getMonster(userId: string, monsterId: string): Promise<MonsterDto> {
    const row = await this.getAccessibleMonster(userId, monsterId);
    if (!row) {
      throw new NotFoundException('Monster not found');
    }
    return this.toDto(row);
  }

  async updateMonster(
    userId: string,
    monsterId: string,
    body: {
      name?: string;
      description?: string | null;
      data?: Record<string, unknown>;
      imageAssetId?: string | null;
    },
  ): Promise<MonsterDto> {
    const current = await this.getAccessibleMonster(userId, monsterId);
    if (!current) {
      throw new NotFoundException('Monster not found');
    }
    if (current.scope === 'system' || current.locked) {
      throw new ForbiddenException('System monsters are immutable');
    }

    await this.ensureEditableByUser(userId, current);

    const [updated] = await this.db
      .update(monsters)
      .set({
        name: body.name?.trim() ?? current.name,
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
      .where(eq(monsters.id, monsterId))
      .returning();

    return this.toDto(updated);
  }

  async deleteMonster(userId: string, monsterId: string): Promise<void> {
    const current = await this.getAccessibleMonster(userId, monsterId);
    if (!current) {
      throw new NotFoundException('Monster not found');
    }
    if (current.scope === 'system' || current.locked) {
      throw new ForbiddenException('System monsters are immutable');
    }

    await this.ensureEditableByUser(userId, current);

    await this.db
      .update(monsters)
      .set({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(monsters.id, monsterId));
  }

  async cloneMonster(
    userId: string,
    monsterId: string,
    body: {
      scope?: 'user' | 'campaign';
      campaignId?: string | null;
      name?: string;
    },
  ): Promise<MonsterDto> {
    const source = await this.getMonster(userId, monsterId);
    const targetScope = body.scope ?? 'user';
    const targetCampaignId =
      targetScope === 'campaign' ? (body.campaignId ?? null) : null;

    if (targetScope === 'campaign' && !targetCampaignId) {
      throw new BadRequestException(
        'campaignId is required for campaign copies',
      );
    }

    if (targetScope === 'campaign' && targetCampaignId) {
      const campaign = await this.campaignsService.getCampaign(
        userId,
        targetCampaignId,
      );
      const canManage = campaign.ownerUserId === userId;
      if (!canManage) {
        throw new ForbiddenException(
          'Only the GM can copy monsters to campaign',
        );
      }
    }

    const [row] = await this.db
      .insert(monsters)
      .values({
        ownerUserId: userId,
        campaignId: targetCampaignId,
        sourceMonsterId: source.id,
        scope: targetScope,
        name: body.name?.trim() || `${source.name} (cópia)`,
        description: source.description ?? null,
        data: source.data,
        imageAssetId: source.imageAssetId ?? null,
        locked: false,
      })
      .returning();

    return this.toDto(row);
  }

  private async getAccessibleMonster(userId: string, monsterId: string) {
    const [row] = await this.db
      .select()
      .from(monsters)
      .where(and(eq(monsters.id, monsterId), isNull(monsters.deletedAt)));

    if (!row) {
      return null;
    }

    if (row.scope === 'system') {
      return row;
    }

    if (row.ownerUserId === userId) {
      return row;
    }

    if (row.campaignId) {
      const campaign = await this.campaignsService.getCampaign(
        userId,
        row.campaignId,
      );
      const memberRole = campaign.members?.find(
        (member) => member.userId === userId,
      )?.role;
      if (campaign.ownerUserId === userId || Boolean(memberRole)) {
        return row;
      }
    }

    return null;
  }

  private async ensureEditableByUser(
    userId: string,
    row: typeof monsters.$inferSelect,
  ) {
    if (row.ownerUserId === userId) {
      return;
    }

    if (!row.campaignId) {
      throw new ForbiddenException('You cannot edit this monster');
    }

    const campaign = await this.campaignsService.getCampaign(
      userId,
      row.campaignId,
    );
    const canManage = campaign.ownerUserId === userId;
    if (!canManage) {
      throw new ForbiddenException('You cannot edit this monster');
    }
  }

  private toDto(row: typeof monsters.$inferSelect): MonsterDto {
    return {
      id: row.id,
      ownerUserId: row.ownerUserId ?? null,
      campaignId: row.campaignId ?? null,
      sourceMonsterId: row.sourceMonsterId ?? null,
      scope: row.scope,
      name: row.name,
      description: row.description ?? null,
      data: row.data ?? {},
      imageAssetId: row.imageAssetId ?? null,
      locked: row.locked,
      deletedAt: row.deletedAt ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
