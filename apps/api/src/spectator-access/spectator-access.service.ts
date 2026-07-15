import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import { campaignSpectatorAccess, campaigns, mediaAssets } from '../database/schema';
import { MediaService } from '../media/media.service';
import { createSpectatorToken, hashSpectatorToken, isSpectatorToken } from './spectator-access.tokens';

export interface SpectatorAccessStatusDto { isActive: boolean; }
export interface SpectatorAccessTokenDto { token: string; }
export interface PublicSpectatorCampaignDto { name: string; description: string | null; hasCoverImage: boolean; }

@Injectable()
export class SpectatorAccessService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly mediaService: MediaService,
  ) {}

  async getStatus(userId: string, campaignId: string): Promise<SpectatorAccessStatusDto> {
    await this.assertOwner(userId, campaignId);
    const [access] = await this.db.select({ campaignId: campaignSpectatorAccess.campaignId }).from(campaignSpectatorAccess).where(eq(campaignSpectatorAccess.campaignId, campaignId));
    return { isActive: Boolean(access) };
  }

  async create(userId: string, campaignId: string): Promise<SpectatorAccessTokenDto> {
    const token = createSpectatorToken();
    try {
      await this.db.transaction(async (tx) => {
        await this.assertOwner(userId, campaignId, tx);
        await tx.insert(campaignSpectatorAccess).values({ campaignId, tokenHash: hashSpectatorToken(token) });
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new ConflictException('Spectator access is already active');
      throw error;
    }
    return { token };
  }

  async rotate(userId: string, campaignId: string): Promise<SpectatorAccessTokenDto> {
    const token = createSpectatorToken();
    await this.db.transaction(async (tx) => {
      await this.assertOwner(userId, campaignId, tx);
      const updated = await tx.update(campaignSpectatorAccess).set({ tokenHash: hashSpectatorToken(token), updatedAt: new Date().toISOString() }).where(eq(campaignSpectatorAccess.campaignId, campaignId)).returning({ campaignId: campaignSpectatorAccess.campaignId });
      if (!updated.length) throw new ConflictException('Spectator access is not active');
    });
    return { token };
  }

  async revoke(userId: string, campaignId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await this.assertOwner(userId, campaignId, tx);
      await tx.delete(campaignSpectatorAccess).where(eq(campaignSpectatorAccess.campaignId, campaignId));
    });
  }

  async getPublicCampaign(token: string): Promise<PublicSpectatorCampaignDto> {
    const row = await this.findPublicAccess(token);
    return { name: row.name, description: row.description, hasCoverImage: Boolean(row.coverAssetId) };
  }

  async getPublicCover(token: string): Promise<{ body: NodeJS.ReadableStream; mimeType: string }> {
    const row = await this.findPublicAccess(token);
    if (!row.coverAssetId) throw new NotFoundException('Spectator access not found');
    const image = await this.mediaService.getImageBuffer(row.coverAssetId);
    return { body: image.body, mimeType: image.mimeType };
  }

  private async findPublicAccess(token: string) {
    if (!isSpectatorToken(token)) throw new NotFoundException('Spectator access not found');
    const [row] = await this.db.select({ name: campaigns.name, description: campaigns.description, coverAssetId: mediaAssets.id })
      .from(campaignSpectatorAccess)
      .innerJoin(campaigns, and(eq(campaigns.id, campaignSpectatorAccess.campaignId), isNull(campaigns.deletedAt)))
      .leftJoin(mediaAssets, and(eq(mediaAssets.id, campaigns.coverImageAssetId), isNull(mediaAssets.deletedAt)))
      .where(eq(campaignSpectatorAccess.tokenHash, hashSpectatorToken(token)));
    if (!row) throw new NotFoundException('Spectator access not found');
    return row;
  }

  private async assertOwner(userId: string, campaignId: string, db: Database = this.db): Promise<void> {
    const [campaign] = await db.select({ ownerUserId: campaigns.ownerUserId }).from(campaigns).where(and(eq(campaigns.id, campaignId), isNull(campaigns.deletedAt)));
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.ownerUserId !== userId) throw new ForbiddenException('Only the GM can manage spectator access');
  }

  private isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
  }
}
