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
import { items, type EntityScope, type ItemKind } from '../database/schema';
import { CampaignsService } from '../campaigns/campaigns.service';
import type {
  CloneItemDto,
  CreateItemDto,
  UpdateItemDto,
} from './item-input.dto';

export interface ItemDto {
  id: string;
  ownerUserId: string | null;
  campaignId: string | null;
  sourceItemId?: string | null;
  scope: EntityScope;
  kind: ItemKind;
  name: string;
  description?: string | null;
  space: number;
  data: Record<string, unknown>;
  imageAssetId?: string | null;
  locked: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ItemsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly campaignsService: CampaignsService,
  ) {}

  async listMyItems(userId: string): Promise<ItemDto[]> {
    const campaignIds = (
      await this.campaignsService.listMyCampaigns(userId)
    ).map((campaign) => campaign.id);

    const visibility = [
      eq(items.scope, 'system'),
      eq(items.ownerUserId, userId),
    ];
    if (campaignIds.length) {
      visibility.push(inArray(items.campaignId, campaignIds));
    }

    const rows = await this.db
      .select()
      .from(items)
      .where(and(isNull(items.deletedAt), or(...visibility)));

    return rows.map((row) => this.toDto(row));
  }

  async createItem(userId: string, body: CreateItemDto): Promise<ItemDto> {
    this.ensureName(body.name);
    if (
      body.scope !== undefined &&
      body.scope !== 'user' &&
      body.scope !== 'campaign'
    )
      throw new BadRequestException('Invalid item scope');
    if (
      body.kind !== undefined &&
      body.kind !== 'item' &&
      body.kind !== 'document'
    )
      throw new BadRequestException('Invalid item kind');
    if (
      body.data !== undefined &&
      (typeof body.data !== 'object' ||
        Array.isArray(body.data) ||
        body.data === null)
    )
      throw new BadRequestException('data must be an object');
    const kind = body.kind ?? 'item';
    const space = this.parseSpace(body.space, kind);
    if (!body.name.trim()) {
      throw new BadRequestException('Item name is required');
    }
    if (body.scope === 'system') {
      throw new ForbiddenException('System items are immutable');
    }
    if (kind === 'document' && body.scope !== 'campaign') {
      throw new ForbiddenException('Documents can only exist inside campaigns');
    }
    if (body.scope === 'campaign' && !body.campaignId) {
      throw new BadRequestException(
        'campaignId is required for campaign items',
      );
    }

    if (body.scope === 'campaign' && body.campaignId) {
      const campaign = await this.campaignsService.getCampaign(
        userId,
        body.campaignId,
      );
      const canManage = campaign.ownerUserId === userId;
      if (!canManage) {
        throw new ForbiddenException('Only the GM can create campaign items');
      }
    }

    const [row] = await this.db
      .insert(items)
      .values({
        ownerUserId: userId,
        campaignId:
          body.scope === 'campaign' ? (body.campaignId ?? null) : null,
        sourceItemId: body.sourceItemId ?? null,
        scope: body.scope ?? 'user',
        kind,
        name: body.name.trim(),
        space,
        description: body.description?.trim() || null,
        data: body.data ?? {},
        imageAssetId: body.imageAssetId ?? null,
        locked: false,
      })
      .returning();

    return this.toDto(row);
  }

  async getItem(userId: string, itemId: string): Promise<ItemDto> {
    const row = await this.getAccessibleItem(userId, itemId);
    if (!row) {
      throw new NotFoundException('Item not found');
    }
    return this.toDto(row);
  }

  async updateItem(
    userId: string,
    itemId: string,
    body: UpdateItemDto,
  ): Promise<ItemDto> {
    const current = await this.getAccessibleItem(userId, itemId);
    if (!current) {
      throw new NotFoundException('Item not found');
    }
    if (current.scope === 'system' || current.locked) {
      throw new ForbiddenException('System items are immutable');
    }

    await this.ensureEditableByUser(userId, current);

    if (body.name !== undefined) this.ensureName(body.name);
    const [updated] = await this.db
      .update(items)
      .set({
        name: body.name?.trim() ?? current.name,
        space: this.parseSpace(body.space ?? current.space, current.kind),
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
      .where(eq(items.id, itemId))
      .returning();

    return this.toDto(updated);
  }

  async deleteItem(userId: string, itemId: string): Promise<void> {
    const current = await this.getAccessibleItem(userId, itemId);
    if (!current) {
      throw new NotFoundException('Item not found');
    }
    if (current.scope === 'system' || current.locked) {
      throw new ForbiddenException('System items are immutable');
    }

    await this.ensureEditableByUser(userId, current);

    await this.db
      .update(items)
      .set({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(items.id, itemId));
  }

  async cloneItem(
    userId: string,
    itemId: string,
    body: CloneItemDto,
  ): Promise<ItemDto> {
    const source = await this.getItem(userId, itemId);
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
        throw new ForbiddenException('Only the GM can copy items to campaign');
      }
    }

    const [row] = await this.db
      .insert(items)
      .values({
        ownerUserId: userId,
        campaignId: targetCampaignId,
        sourceItemId: source.id,
        scope: targetScope,
        kind: source.kind,
        name: body.name?.trim() || `${source.name} (cópia)`,
        space: source.space,
        description: source.description ?? null,
        data: source.data,
        imageAssetId: source.imageAssetId ?? null,
        locked: false,
      })
      .returning();

    return this.toDto(row);
  }

  private async getAccessibleItem(userId: string, itemId: string) {
    const [row] = await this.db
      .select()
      .from(items)
      .where(and(eq(items.id, itemId), isNull(items.deletedAt)));

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
    row: typeof items.$inferSelect,
  ) {
    if (row.ownerUserId === userId) {
      return;
    }

    if (!row.campaignId) {
      throw new ForbiddenException('You cannot edit this item');
    }

    const campaign = await this.campaignsService.getCampaign(
      userId,
      row.campaignId,
    );
    const canManage = campaign.ownerUserId === userId;
    if (!canManage) {
      throw new ForbiddenException('You cannot edit this item');
    }
  }

  private toDto(row: typeof items.$inferSelect): ItemDto {
    return {
      id: row.id,
      ownerUserId: row.ownerUserId ?? null,
      campaignId: row.campaignId ?? null,
      sourceItemId: row.sourceItemId ?? null,
      scope: row.scope,
      kind: row.kind,
      name: row.name,
      description: row.description ?? null,
      space: row.space,
      data: row.data ?? {},
      imageAssetId: row.imageAssetId ?? null,
      locked: row.locked,
      deletedAt: row.deletedAt ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private ensureName(name: unknown): asserts name is string {
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 200)
      throw new BadRequestException(
        'Item name must be between 1 and 200 characters',
      );
  }

  private parseSpace(value: unknown, kind: ItemKind): number {
    if (kind === 'document') {
      if (value !== undefined && value !== 0)
        throw new BadRequestException('Documents must have zero space');
      return 0;
    }
    if (value === undefined) return 0;
    if (!Number.isInteger(value) || value < 0 || value > 9999)
      throw new BadRequestException(
        'space must be an integer between 0 and 9999',
      );
    return value;
  }
}
