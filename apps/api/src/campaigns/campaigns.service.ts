import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, isNull, lt, sql } from 'drizzle-orm';
import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import {
  campaignMembers,
  campaignInvitations,
  campaigns,
  characters,
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
        role: 'player',
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

    const now = new Date().toISOString();
    await this.db
      .update(campaigns)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(campaigns.id, campaignId));
    // A campaign-bound sheet is historical once its campaign ends.  It stays
    // visible to its owner as an archived record and can only be copied.
    await this.db.update(characters).set({ status: 'archived', frozenAt: now, updatedAt: now }).where(
      and(eq(characters.campaignId, campaignId), eq(characters.kind, 'pc')),
    );
  }

  async removeMember(
    userId: string,
    campaignId: string,
    memberUserId: string,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [campaign] = await tx.execute(sql`SELECT * FROM campaigns WHERE id = ${campaignId} AND deleted_at IS NULL FOR UPDATE`);
      if (!campaign) throw new NotFoundException('Campaign not found');
      if (campaign.owner_user_id !== userId) throw new ForbiddenException('Only the campaign owner can remove members');
      if (memberUserId === campaign.owner_user_id) throw new BadRequestException('The campaign owner cannot be removed');
      await tx.delete(campaignMembers).where(and(eq(campaignMembers.campaignId, campaignId), eq(campaignMembers.userId, memberUserId)));
      const now = new Date().toISOString();
      await tx.update(characters).set({ status: 'archived', frozenAt: now, updatedAt: now }).where(and(
        eq(characters.campaignId, campaignId),
        eq(characters.ownerUserId, memberUserId),
        eq(characters.kind, 'pc'),
      ));
    });
  }

  async invitePlayer(userId: string, campaignId: string, shortCode: string) {
    const player = await this.usersService.findPublicByShortCode(shortCode);
    return this.db.transaction(async (tx) => {
      const [campaign] = await tx.execute(sql`SELECT * FROM campaigns WHERE id = ${campaignId} AND deleted_at IS NULL FOR UPDATE`);
      if (!campaign) throw new NotFoundException('Campaign not found');
      if (campaign.owner_user_id !== userId) throw new ForbiddenException('Only the campaign owner can invite players');
      const now = new Date().toISOString();
      await tx.update(campaignInvitations).set({ status: 'expired', resolvedAt: now }).where(and(eq(campaignInvitations.campaignId, campaignId), eq(campaignInvitations.status, 'pending'), lt(campaignInvitations.expiresAt, now)));
      if (player.id === userId) throw new ConflictException('The campaign owner cannot be invited');
      const [member] = await tx.select({ userId: campaignMembers.userId }).from(campaignMembers).where(and(eq(campaignMembers.campaignId, campaignId), eq(campaignMembers.userId, player.id)));
      if (member) throw new ConflictException('This player is already a campaign member');
      const [pending] = await tx.select({ id: campaignInvitations.id }).from(campaignInvitations).where(and(eq(campaignInvitations.campaignId, campaignId), eq(campaignInvitations.invitedUserId, player.id), eq(campaignInvitations.status, 'pending')));
      if (pending) throw new ConflictException('A pending invitation already exists');
      const [members] = await tx.select({ count: sql<number>`count(*)::int` }).from(campaignMembers).where(eq(campaignMembers.campaignId, campaignId));
      const [invitations] = await tx.select({ count: sql<number>`count(*)::int` }).from(campaignInvitations).where(and(eq(campaignInvitations.campaignId, campaignId), eq(campaignInvitations.status, 'pending')));
      if (members.count + invitations.count >= 9) throw new ConflictException('Campaign capacity is full');
      const [invitation] = await tx.insert(campaignInvitations).values({ campaignId, invitedUserId: player.id, invitedByUserId: userId, expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() }).returning();
      return invitation;
    });
  }

  async cancelInvitation(userId: string, campaignId: string, invitationId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [campaign] = await tx.execute(sql`SELECT * FROM campaigns WHERE id = ${campaignId} AND deleted_at IS NULL FOR UPDATE`);
      if (!campaign) throw new NotFoundException('Campaign not found');
      if (campaign.owner_user_id !== userId) throw new ForbiddenException('Only the campaign owner can cancel invitations');
      const now = new Date().toISOString();
      await tx.update(campaignInvitations).set({ status: 'expired', resolvedAt: now }).where(and(
        eq(campaignInvitations.campaignId, campaignId),
        eq(campaignInvitations.status, 'pending'),
        lt(campaignInvitations.expiresAt, now),
      ));
      const result = await tx.update(campaignInvitations).set({ status: 'cancelled', resolvedAt: now }).where(and(
        eq(campaignInvitations.id, invitationId),
        eq(campaignInvitations.campaignId, campaignId),
        eq(campaignInvitations.status, 'pending'),
      )).returning({ id: campaignInvitations.id });
      if (!result.length) throw new NotFoundException('Pending invitation not found');
    });
  }

  async listMyInvitations(userId: string) {
    const now = new Date().toISOString();
    await this.db.update(campaignInvitations).set({ status: 'expired', resolvedAt: now }).where(and(
      eq(campaignInvitations.invitedUserId, userId),
      eq(campaignInvitations.status, 'pending'),
      lt(campaignInvitations.expiresAt, now),
    ));
    return this.db.select({ invitation: campaignInvitations, campaignName: campaigns.name, invitedByName: users.name }).from(campaignInvitations)
      .innerJoin(campaigns, eq(campaigns.id, campaignInvitations.campaignId))
      .innerJoin(users, eq(users.id, campaignInvitations.invitedByUserId))
      .where(and(eq(campaignInvitations.invitedUserId, userId), eq(campaignInvitations.status, 'pending')));
  }

  async listCampaignInvitations(userId: string, campaignId: string) {
    const access = await this.getCampaignAccess(userId, campaignId);
    if (!access?.isManager) throw new ForbiddenException('Only the GM can view invitations');
    const now = new Date().toISOString();
    await this.db.update(campaignInvitations).set({ status: 'expired', resolvedAt: now }).where(and(
      eq(campaignInvitations.campaignId, campaignId),
      eq(campaignInvitations.status, 'pending'),
      lt(campaignInvitations.expiresAt, now),
    ));
    return this.db.select({
      id: campaignInvitations.id,
      invitedUserId: campaignInvitations.invitedUserId,
      invitedUserName: users.name,
      invitedUserShortCode: users.shortCode,
      expiresAt: campaignInvitations.expiresAt,
      status: campaignInvitations.status,
    }).from(campaignInvitations)
      .innerJoin(users, eq(users.id, campaignInvitations.invitedUserId))
      .where(and(eq(campaignInvitations.campaignId, campaignId), eq(campaignInvitations.status, 'pending')));
  }

  async respondToInvitation(userId: string, invitationId: string, accepted: boolean) {
    await this.db.transaction(async (tx) => {
      const [initialInvitation] = await tx.select().from(campaignInvitations).where(eq(campaignInvitations.id, invitationId));
      if (!initialInvitation || initialInvitation.invitedUserId !== userId) throw new NotFoundException('Invitation not found');
      await tx.execute(sql`SELECT id FROM campaigns WHERE id = ${initialInvitation.campaignId} FOR UPDATE`);
      const [invitation] = await tx.select().from(campaignInvitations).where(eq(campaignInvitations.id, invitationId));
      if (!invitation || invitation.invitedUserId !== userId || invitation.status !== 'pending') throw new NotFoundException('Invitation not found');
      const now = new Date().toISOString();
      await tx.update(campaignInvitations).set({ status: 'expired', resolvedAt: now }).where(and(
        eq(campaignInvitations.campaignId, invitation.campaignId),
        eq(campaignInvitations.status, 'pending'),
        lt(campaignInvitations.expiresAt, now),
      ));
      const [currentInvitation] = await tx.select().from(campaignInvitations).where(eq(campaignInvitations.id, invitationId));
      if (!currentInvitation || currentInvitation.status !== 'pending') throw new BadRequestException('Invitation expired');
      if (!accepted) { await tx.update(campaignInvitations).set({ status: 'declined', resolvedAt: now }).where(eq(campaignInvitations.id, invitationId)); return; }
      const [members] = await tx.select({ count: sql<number>`count(*)::int` }).from(campaignMembers).where(eq(campaignMembers.campaignId, invitation.campaignId));
      const [pending] = await tx.select({ count: sql<number>`count(*)::int` }).from(campaignInvitations).where(and(eq(campaignInvitations.campaignId, invitation.campaignId), eq(campaignInvitations.status, 'pending')));
      if (members.count + pending.count > 9) throw new BadRequestException('Campaign capacity is full');
      await tx.insert(campaignMembers).values({ campaignId: invitation.campaignId, userId }).onConflictDoNothing();
      await tx.update(campaignInvitations).set({ status: 'accepted', resolvedAt: now }).where(and(eq(campaignInvitations.id, invitationId), eq(campaignInvitations.status, 'pending')));
    });
  }

  async leaveCampaign(userId: string, campaignId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [campaign] = await tx.execute(sql`SELECT * FROM campaigns WHERE id = ${campaignId} AND deleted_at IS NULL FOR UPDATE`);
      if (!campaign) throw new NotFoundException('Campaign not found');
      if (campaign.owner_user_id === userId) throw new BadRequestException('The campaign owner cannot leave their campaign');
      const [member] = await tx.select({ userId: campaignMembers.userId }).from(campaignMembers).where(and(
        eq(campaignMembers.campaignId, campaignId),
        eq(campaignMembers.userId, userId),
      ));
      if (!member) throw new NotFoundException('Campaign not found');
      await tx.delete(campaignMembers).where(and(eq(campaignMembers.campaignId, campaignId), eq(campaignMembers.userId, userId)));
      const now = new Date().toISOString();
      await tx.update(characters).set({ status: 'archived', frozenAt: now, updatedAt: now }).where(and(
        eq(characters.campaignId, campaignId),
        eq(characters.ownerUserId, userId),
        eq(characters.kind, 'pc'),
      ));
    });
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
        role: sql<CampaignMemberRole | null>`CASE WHEN ${campaignMembers.userId} IS NULL THEN NULL ELSE 'player' END`,
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
      isManager: row.campaign.ownerUserId === userId,
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
