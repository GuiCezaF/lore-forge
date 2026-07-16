import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { CampaignsService } from '../campaigns/campaigns.service';
import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import { campaignClues } from '../database/schema';
import { validateCampaignClueContent } from './campaign-clue-content';
import type {
  CampaignClueDetailDto,
  CampaignClueStyle,
  CampaignClueSummaryDto,
} from './campaign-clues.dto';
import { CAMPAIGN_CLUE_STYLES } from './campaign-clues.dto';

@Injectable()
export class CampaignCluesService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly campaignsService: CampaignsService,
  ) {}

  async list(
    userId: string,
    campaignId: string,
  ): Promise<CampaignClueSummaryDto[]> {
    await this.ensureManager(userId, campaignId);
    const rows = await this.db
      .select()
      .from(campaignClues)
      .where(eq(campaignClues.campaignId, campaignId))
      .orderBy(desc(campaignClues.updatedAt));
    return rows.map((row) => this.toSummary(row));
  }

  async create(
    userId: string,
    campaignId: string,
    body: unknown,
  ): Promise<CampaignClueDetailDto> {
    await this.ensureManager(userId, campaignId);
    const input = this.validateSaveInput(body);
    const [row] = await this.db
      .insert(campaignClues)
      .values({ campaignId, kind: 'text', ...input })
      .returning();
    return this.toDetail(row);
  }

  async get(
    userId: string,
    campaignId: string,
    clueId: string,
  ): Promise<CampaignClueDetailDto> {
    await this.ensureManager(userId, campaignId);
    const row = await this.findClue(campaignId, clueId);
    return this.toDetail(row);
  }

  async update(
    userId: string,
    campaignId: string,
    clueId: string,
    body: unknown,
  ): Promise<CampaignClueDetailDto> {
    await this.ensureManager(userId, campaignId);
    await this.findClue(campaignId, clueId);
    const input = this.validateSaveInput(body);
    const [row] = await this.db
      .update(campaignClues)
      .set({ ...input, updatedAt: new Date().toISOString() })
      .where(
        and(
          eq(campaignClues.id, clueId),
          eq(campaignClues.campaignId, campaignId),
        ),
      )
      .returning();
    return this.toDetail(row);
  }

  private async ensureManager(
    userId: string,
    campaignId: string,
  ): Promise<void> {
    const campaign = await this.campaignsService.getCampaign(
      userId,
      campaignId,
    );
    if (campaign.ownerUserId !== userId)
      throw new ForbiddenException('Only the GM can manage campaign clues');
  }

  private async findClue(
    campaignId: string,
    clueId: string,
  ): Promise<typeof campaignClues.$inferSelect> {
    const [row] = await this.db
      .select()
      .from(campaignClues)
      .where(
        and(
          eq(campaignClues.id, clueId),
          eq(campaignClues.campaignId, campaignId),
        ),
      )
      .limit(1);
    if (!row) throw new NotFoundException('Campaign clue not found');
    return row;
  }

  private validateSaveInput(
    value: unknown,
  ): Omit<typeof campaignClues.$inferInsert, 'campaignId' | 'kind'> {
    if (
      !isRecord(value) ||
      Object.keys(value).length !== 5 ||
      !['gmLabel', 'title', 'privateNotes', 'style', 'content'].every(
        (key) => key in value,
      )
    ) {
      throw new BadRequestException(
        'A complete campaign clue payload is required',
      );
    }
    if (
      typeof value.gmLabel !== 'string' ||
      value.gmLabel.trim().length < 1 ||
      value.gmLabel.trim().length > 120
    )
      throw new BadRequestException(
        'gmLabel must be between 1 and 120 characters',
      );
    const title = normalizeNullableText(value.title, 200, 'title');
    const privateNotes = normalizeNullableText(
      value.privateNotes,
      10_000,
      'privateNotes',
    );
    if (
      typeof value.style !== 'string' ||
      !CAMPAIGN_CLUE_STYLES.includes(value.style as CampaignClueStyle)
    )
      throw new BadRequestException('style is invalid');
    return {
      gmLabel: value.gmLabel.trim(),
      title,
      privateNotes,
      style: value.style as CampaignClueStyle,
      content: validateCampaignClueContent(value.content),
    };
  }

  private toSummary(
    row: typeof campaignClues.$inferSelect,
  ): CampaignClueSummaryDto {
    return {
      id: row.id,
      campaignId: row.campaignId,
      kind: row.kind,
      gmLabel: row.gmLabel,
      title: row.title,
      style: row.style,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toDetail(
    row: typeof campaignClues.$inferSelect,
  ): CampaignClueDetailDto {
    return {
      ...this.toSummary(row),
      privateNotes: row.privateNotes,
      content: row.content,
    };
  }
}

function normalizeNullableText(
  value: unknown,
  maxLength: number,
  name: string,
): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || value.length > maxLength)
    throw new BadRequestException(`${name} must be a string or null`);
  return value.trim() || null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
