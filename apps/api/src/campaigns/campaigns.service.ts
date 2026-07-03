import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, isNull, or, desc } from 'drizzle-orm';
import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import {
  campaignMembers,
  campaigns,
  users,
  type CampaignMemberRole,
} from '../database/schema';
import { UsersService } from '../users/users.service';

export interface CampaignMemberDto {
  userId: string;
  shortCode: string;
  name: string;
  picture?: string;
  role: CampaignMemberRole;
}

export interface CampaignDto {
  id: string;
  ownerUserId: string | null;
  name: string;
  description?: string | null;
  coverImageAssetId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  members?: CampaignMemberDto[];
}

@Injectable()
export class CampaignsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly usersService: UsersService,
  ) {}

  async listMyCampaigns(userId: string): Promise<CampaignDto[]> {
    const owned = await this.db
      .select()
      .from(campaigns)
      .where(
        and(eq(campaigns.ownerUserId, userId), isNull(campaigns.deletedAt)),
      );

    const memberRows = await this.db
      .select({ campaignId: campaignMembers.campaignId })
      .from(campaignMembers)
      .innerJoin(campaigns, eq(campaigns.id, campaignMembers.campaignId))
      .where(
        and(eq(campaignMembers.userId, userId), isNull(campaigns.deletedAt)),
      );

    const memberIds = [...new Set(memberRows.map((row) => row.campaignId))];
    const memberCampaigns =
      memberIds.length > 0
        ? await this.db
            .select()
            .from(campaigns)
            .where(
              and(
                isNull(campaigns.deletedAt),
                inArray(campaigns.id, memberIds),
              ),
            )
        : [];

    const all = [...owned, ...memberCampaigns];
    const uniqueById = new Map(all.map((row) => [row.id, row]));
    return [...uniqueById.values()]
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      )
      .map((row) => this.toCampaignDto(row));
  }

  async createCampaign(
    userId: string,
    body: { name: string; description?: string | null },
  ): Promise<CampaignDto> {
    if (!body.name.trim()) {
      throw new BadRequestException('Campaign name is required');
    }

    const [campaign] = await this.db
      .insert(campaigns)
      .values({
        ownerUserId: userId,
        name: body.name.trim(),
        description: body.description?.trim() || null,
      })
      .returning();

    await this.db.insert(campaignMembers).values({
      campaignId: campaign.id,
      userId,
      role: 'gm',
    });

    return this.toCampaignDto(campaign);
  }

  async getCampaign(userId: string, campaignId: string): Promise<CampaignDto> {
    const access = await this.getCampaignAccess(userId, campaignId);
    if (!access) {
      throw new NotFoundException('Campaign not found');
    }

    const members = await this.db
      .select({
        userId: users.id,
        shortCode: users.shortCode,
        name: users.name,
        picture: users.picture,
        role: campaignMembers.role,
      })
      .from(campaignMembers)
      .innerJoin(users, eq(users.id, campaignMembers.userId))
      .where(eq(campaignMembers.campaignId, campaignId));

    return {
      ...this.toCampaignDto(access.campaign),
      members: members.map((member) => ({
        userId: member.userId,
        shortCode: member.shortCode,
        name: member.name,
        picture: member.picture ?? undefined,
        role: member.role,
      })),
    };
  }

  async updateCampaign(
    userId: string,
    campaignId: string,
    body: {
      name?: string;
      description?: string | null;
      coverImageAssetId?: string | null;
    },
  ): Promise<CampaignDto> {
    const access = await this.getCampaignAccess(userId, campaignId);
    if (!access) {
      throw new NotFoundException('Campaign not found');
    }
    if (!access.isManager) {
      throw new ForbiddenException('Only the GM can edit the campaign');
    }

    const [updated] = await this.db
      .update(campaigns)
      .set({
        name: body.name?.trim() ?? access.campaign.name,
        description:
          body.description === undefined
            ? access.campaign.description
            : body.description?.trim() || null,
        coverImageAssetId:
          body.coverImageAssetId === undefined
            ? access.campaign.coverImageAssetId
            : body.coverImageAssetId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(campaigns.id, campaignId))
      .returning();

    return this.toCampaignDto(updated);
  }

  async deleteCampaign(userId: string, campaignId: string): Promise<void> {
    const access = await this.getCampaignAccess(userId, campaignId);
    if (!access) {
      throw new NotFoundException('Campaign not found');
    }
    if (!access.isManager) {
      throw new ForbiddenException('Only the GM can delete the campaign');
    }

    await this.db
      .update(campaigns)
      .set({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(campaigns.id, campaignId));
  }

  async addMember(
    userId: string,
    campaignId: string,
    body: { shortCode: string; role: CampaignMemberRole },
  ): Promise<CampaignMemberDto> {
    const access = await this.getCampaignAccess(userId, campaignId);
    if (!access) {
      throw new NotFoundException('Campaign not found');
    }
    if (!access.isManager) {
      throw new ForbiddenException('Only the GM can add members');
    }

    const targetUser = await this.usersService.findPublicByShortCode(
      body.shortCode,
    );
    await this.db
      .insert(campaignMembers)
      .values({
        campaignId,
        userId: targetUser.id,
        role: body.role,
      })
      .onConflictDoUpdate({
        target: [campaignMembers.campaignId, campaignMembers.userId],
        set: {
          role: body.role,
        },
      });

    return {
      userId: targetUser.id,
      shortCode: targetUser.shortCode,
      name: targetUser.name,
      picture: targetUser.picture ?? undefined,
      role: body.role,
    };
  }

  async removeMember(
    userId: string,
    campaignId: string,
    memberUserId: string,
  ): Promise<void> {
    const access = await this.getCampaignAccess(userId, campaignId);
    if (!access) {
      throw new NotFoundException('Campaign not found');
    }
    if (!access.isManager) {
      throw new ForbiddenException('Only the GM can remove members');
    }

    await this.db
      .delete(campaignMembers)
      .where(
        and(
          eq(campaignMembers.campaignId, campaignId),
          eq(campaignMembers.userId, memberUserId),
        ),
      );
  }

  private async getCampaignAccess(
    userId: string,
    campaignId: string,
  ): Promise<
    | {
        campaign: typeof campaigns.$inferSelect;
        role: CampaignMemberRole | null;
        isManager: boolean;
      }
    | undefined
  > {
    const [row] = await this.db
      .select({
        campaign: campaigns,
        role: campaignMembers.role,
      })
      .from(campaigns)
      .leftJoin(
        campaignMembers,
        and(
          eq(campaignMembers.campaignId, campaigns.id),
          eq(campaignMembers.userId, userId),
        ),
      )
      .where(and(eq(campaigns.id, campaignId), isNull(campaigns.deletedAt)));

    if (!row || (!row.role && row.campaign.ownerUserId !== userId)) {
      return undefined;
    }

    return {
      campaign: row.campaign,
      role: row.role ?? null,
      isManager: row.campaign.ownerUserId === userId || row.role === 'gm',
    };
  }

  private toCampaignDto(row: typeof campaigns.$inferSelect): CampaignDto {
    return {
      id: row.id,
      ownerUserId: row.ownerUserId ?? null,
      name: row.name,
      description: row.description ?? null,
      coverImageAssetId: row.coverImageAssetId ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? null,
    };
  }
}
