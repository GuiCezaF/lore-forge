import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, isNull, lt } from 'drizzle-orm';
import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import {
  campaignMembers,
  campaignInvitations,
  campaigns,
  characterSelections,
  characterSkills,
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
    if (memberUserId !== access.campaign.ownerUserId) {
      await this.archiveCampaignSheets(campaignId, memberUserId);
    }
  }

  async invitePlayer(userId: string, campaignId: string, shortCode: string) {
    const access = await this.getCampaignAccess(userId, campaignId);
    if (!access?.isManager) throw new ForbiddenException('Only the GM can invite players');
    const player = await this.usersService.findPublicByShortCode(shortCode);
    const [existingMember] = await this.db
      .select({ userId: campaignMembers.userId })
      .from(campaignMembers)
      .where(and(
        eq(campaignMembers.campaignId, campaignId),
        eq(campaignMembers.userId, player.id),
      ));
    if (existingMember) {
      throw new BadRequestException('This player is already a campaign member');
    }
    const existing = await this.db.select().from(campaignInvitations).where(and(eq(campaignInvitations.campaignId, campaignId), eq(campaignInvitations.invitedUserId, player.id), eq(campaignInvitations.status, 'pending')));
    if (existing[0]) throw new BadRequestException('A pending invitation already exists');
    const [invitation] = await this.db.insert(campaignInvitations).values({ campaignId, invitedUserId: player.id, invitedByUserId: userId, expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() }).returning();
    return invitation;
  }

  async cancelInvitation(userId: string, campaignId: string, invitationId: string): Promise<void> {
    const access = await this.getCampaignAccess(userId, campaignId);
    if (!access?.isManager) throw new ForbiddenException('Only the GM can cancel invitations');
    const result = await this.db.update(campaignInvitations).set({ status: 'cancelled', resolvedAt: new Date().toISOString() }).where(and(
      eq(campaignInvitations.id, invitationId),
      eq(campaignInvitations.campaignId, campaignId),
      eq(campaignInvitations.status, 'pending'),
    )).returning({ id: campaignInvitations.id });
    if (!result.length) throw new NotFoundException('Pending invitation not found');
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

  async respondToInvitation(userId: string, invitationId: string, accepted: boolean, characterId?: string, newCharacter?: { name?: string; sheetLabel?: string }) {
    const [invitation] = await this.db.select().from(campaignInvitations).where(eq(campaignInvitations.id, invitationId));
    if (!invitation || invitation.invitedUserId !== userId || invitation.status !== 'pending') throw new NotFoundException('Invitation not found');
    if (Date.parse(invitation.expiresAt) <= Date.now()) { await this.db.update(campaignInvitations).set({ status: 'expired', resolvedAt: new Date().toISOString() }).where(eq(campaignInvitations.id, invitationId)); throw new BadRequestException('Invitation expired'); }
    const now = new Date().toISOString();
    if (!accepted) {
      await this.db.update(campaignInvitations).set({ status: 'declined', resolvedAt: now }).where(eq(campaignInvitations.id, invitationId));
      return;
    }

    // Validate the requested sheet before resolving the invitation. A failed
    // request must leave it pending so the player can correct their choice.
    let selectedCharacter: typeof characters.$inferSelect | undefined;
    if (characterId) {
      const [character] = await this.db.select().from(characters).where(and(eq(characters.id, characterId), eq(characters.ownerUserId, userId)));
      if (!character || character.kind !== 'pc' || character.status === 'archived') throw new BadRequestException('Select an available Player Character sheet');
      if (character.campaignId === invitation.campaignId) {
        throw new BadRequestException('This Player Character is already assigned to the campaign');
      }
      selectedCharacter = character;
    }

    await this.db.transaction(async (tx) => {
      await tx.insert(campaignMembers).values({ campaignId: invitation.campaignId, userId, role: 'player' }).onConflictDoNothing();
      if (selectedCharacter) {
        if (!selectedCharacter.campaignId) {
          // An unfinished sheet remains a draft after it is bound.  Promoting
          // it here would let an invalid build bypass the finalization
          // validation in CharactersService.
          await tx.update(characters).set({ campaignId: invitation.campaignId, updatedAt: now }).where(eq(characters.id, selectedCharacter.id));
        } else {
          await this.copySheetIntoCampaign(selectedCharacter, invitation.campaignId, userId, now, tx);
        }
      } else {
        await tx.insert(characters).values({
          ownerUserId: userId, campaignId: invitation.campaignId, kind: 'pc', status: 'draft',
          sheetLabel: newCharacter?.sheetLabel?.trim() || null,
          name: newCharacter?.name?.trim() || 'Untitled agent', rulesetVersion: 'op-rpg-1.3', updatedAt: now,
        });
      }
      await tx.update(campaignInvitations).set({ status: 'accepted', resolvedAt: now }).where(eq(campaignInvitations.id, invitationId));
    });
  }

  async leaveCampaign(userId: string, campaignId: string): Promise<void> {
    const access = await this.getCampaignAccess(userId, campaignId);
    if (!access) throw new NotFoundException('Campaign not found');
    if (access.campaign.ownerUserId === userId) throw new BadRequestException('The campaign owner cannot leave their campaign');
    await this.db.delete(campaignMembers).where(and(eq(campaignMembers.campaignId, campaignId), eq(campaignMembers.userId, userId)));
    await this.archiveCampaignSheets(campaignId, userId);
  }

  private async archiveCampaignSheets(campaignId: string, ownerUserId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.update(characters).set({ status: 'archived', frozenAt: now, updatedAt: now }).where(and(
      eq(characters.campaignId, campaignId),
      eq(characters.ownerUserId, ownerUserId),
      eq(characters.kind, 'pc'),
    ));
  }

  private async copySheetIntoCampaign(
    source: typeof characters.$inferSelect,
    campaignId: string,
    ownerUserId: string,
    now: string,
    db: Pick<Database, 'insert' | 'select'> = this.db,
  ): Promise<void> {
    const [copy] = await db.insert(characters).values({
      ownerUserId,
      campaignId,
      sourceCharacterId: source.id,
      kind: 'pc',
      status: 'active',
      sheetLabel: source.sheetLabel,
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
    }).returning({ id: characters.id });
    // This is a permanent-sheet snapshot only. Campaign state and inventory
    // deliberately begin empty, but player selections belong to the sheet.
    const [skills, selections] = await Promise.all([
      db.select().from(characterSkills).where(eq(characterSkills.characterId, source.id)),
      db.select().from(characterSelections).where(eq(characterSelections.characterId, source.id)),
    ]);
    if (skills.length) await db.insert(characterSkills).values(skills.map(({ id: _id, characterId: _characterId, ...skill }) => ({ ...skill, characterId: copy.id })));
    if (selections.length) await db.insert(characterSelections).values(selections.map(({ id: _id, characterId: _characterId, ...selection }) => ({ ...selection, characterId: copy.id })));
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
