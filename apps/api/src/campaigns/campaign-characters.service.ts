import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import {
  campaignCharacterStates,
  campaignMembers,
  campaigns,
  characters,
  type CharacterArchiveReason,
} from '../database/schema';

/** Owns the irreversible lifecycle of a PC after its first campaign attachment. */
@Injectable()
export class CampaignCharactersService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async activateCharacter(
    playerUserId: string,
    campaignId: string,
    characterId: string,
  ): Promise<typeof characters.$inferSelect> {
    try {
      return await this.db.transaction(async (tx) => {
        const [campaign] = await tx
          .select()
          .from(campaigns)
          .where(and(eq(campaigns.id, campaignId), isNull(campaigns.deletedAt)))
          .for('update');
        if (!campaign) throw new NotFoundException('Campaign not found');

        const [member] = await tx
          .select({ userId: campaignMembers.userId })
          .from(campaignMembers)
          .where(
            and(
              eq(campaignMembers.campaignId, campaignId),
              eq(campaignMembers.userId, playerUserId),
            ),
          );
        if (!member)
          throw new ForbiddenException(
            'Join the campaign before attaching a character',
          );

        const [character] = await tx
          .select()
          .from(characters)
          .where(
            and(eq(characters.id, characterId), isNull(characters.deletedAt)),
          )
          .for('update');
        if (!character || character.kind !== 'pc')
          throw new NotFoundException('Character not found');
        if (character.ownerUserId !== playerUserId)
          throw new ForbiddenException(
            'Only the sheet owner can attach this character',
          );
        if (character.status === 'draft')
          throw new ConflictException(
            'Finish the character before attaching it',
          );
        if (character.status === 'archived')
          throw new ConflictException(
            'Archived characters cannot be reactivated',
          );
        if (character.campaignId && character.campaignId !== campaignId)
          throw new ConflictException(
            'A character cannot move to another campaign',
          );
        if (
          !(
            (character.status === 'active' && !character.campaignId) ||
            (character.status === 'inactive' &&
              character.campaignId === campaignId) ||
            (character.status === 'active' &&
              character.campaignId === campaignId)
          )
        )
          throw new ConflictException(
            'This character is not eligible for this campaign',
          );

        const [active] = await tx
          .select({ id: characters.id })
          .from(characters)
          .where(
            and(
              eq(characters.campaignId, campaignId),
              eq(characters.ownerUserId, playerUserId),
              eq(characters.kind, 'pc'),
              eq(characters.status, 'active'),
              isNull(characters.deletedAt),
            ),
          )
          .for('update');
        if (active && active.id !== characterId)
          throw new ConflictException(
            'This player already has an active campaign character',
          );

        if (
          character.status === 'active' &&
          character.campaignId === campaignId
        )
          return character;

        const now = new Date().toISOString();
        const isFirstAttachment = !character.campaignId;
        if (isFirstAttachment) {
          await tx
            .update(characters)
            .set({
              status: 'archived',
              archiveReason: 'replaced',
              frozenAt: now,
              statusChangedAt: now,
              updatedAt: now,
            })
            .where(
              and(
                eq(characters.campaignId, campaignId),
                eq(characters.ownerUserId, playerUserId),
                eq(characters.kind, 'pc'),
                eq(characters.status, 'inactive'),
              ),
            );
        }
        const [activated] = await tx
          .update(characters)
          .set({
            campaignId: campaignId,
            campaignAttachedAt: character.campaignAttachedAt ?? now,
            status: 'active',
            statusChangedAt: now,
            archiveReason: null,
            frozenAt: null,
            updatedAt: now,
          })
          .where(eq(characters.id, characterId))
          .returning();
        if (isFirstAttachment) {
          await tx
            .insert(campaignCharacterStates)
            .values({
              characterId,
              currentHp: activated.maxHp ?? 0,
              currentSan: activated.maxSan ?? 0,
              currentEp: activated.maxEp ?? 0,
            })
            .onConflictDoNothing();
        }
        return activated;
      });
    } catch (error: unknown) {
      if (this.isActiveSlotViolation(error))
        throw new ConflictException(
          'This player already has an active campaign character',
        );
      throw error;
    }
  }

  async deactivateCharacter(
    campaignId: string,
    playerUserId: string,
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.db
      .update(characters)
      .set({ status: 'inactive', statusChangedAt: now, updatedAt: now })
      .where(
        and(
          eq(characters.campaignId, campaignId),
          eq(characters.ownerUserId, playerUserId),
          eq(characters.kind, 'pc'),
          eq(characters.status, 'active'),
        ),
      );
  }

  async leaveCampaign(
    actorUserId: string,
    campaignId: string,
    memberUserId: string,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [campaign] = await tx
        .select()
        .from(campaigns)
        .where(and(eq(campaigns.id, campaignId), isNull(campaigns.deletedAt)))
        .for('update');
      if (!campaign) throw new NotFoundException('Campaign not found');
      if (memberUserId === campaign.ownerUserId)
        throw new BadRequestException(
          'The campaign owner cannot leave their campaign',
        );
      if (actorUserId !== memberUserId && actorUserId !== campaign.ownerUserId)
        throw new ForbiddenException('Only the GM can remove members');
      const [member] = await tx
        .select({ userId: campaignMembers.userId })
        .from(campaignMembers)
        .where(
          and(
            eq(campaignMembers.campaignId, campaignId),
            eq(campaignMembers.userId, memberUserId),
          ),
        );
      if (!member) throw new NotFoundException('Campaign member not found');
      const now = new Date().toISOString();
      await tx
        .update(characters)
        .set({ status: 'inactive', statusChangedAt: now, updatedAt: now })
        .where(
          and(
            eq(characters.campaignId, campaignId),
            eq(characters.ownerUserId, memberUserId),
            eq(characters.kind, 'pc'),
            eq(characters.status, 'active'),
          ),
        );
      await tx
        .delete(campaignMembers)
        .where(
          and(
            eq(campaignMembers.campaignId, campaignId),
            eq(campaignMembers.userId, memberUserId),
          ),
        );
    });
  }

  async archiveCharacter(
    gmUserId: string,
    campaignId: string,
    characterId: string,
    reason: Extract<CharacterArchiveReason, 'retired' | 'deceased'>,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [campaign] = await tx
        .select()
        .from(campaigns)
        .where(and(eq(campaigns.id, campaignId), isNull(campaigns.deletedAt)))
        .for('update');
      if (!campaign) throw new NotFoundException('Campaign not found');
      if (campaign.ownerUserId !== gmUserId)
        throw new ForbiddenException(
          'Only the GM can archive campaign characters',
        );
      const [character] = await tx
        .select({
          id: characters.id,
          kind: characters.kind,
          status: characters.status,
        })
        .from(characters)
        .where(
          and(
            eq(characters.id, characterId),
            eq(characters.campaignId, campaignId),
          ),
        )
        .for('update');
      if (!character || character.kind !== 'pc')
        throw new NotFoundException('Campaign character not found');
      if (character.status === 'archived')
        throw new ConflictException('Character is already archived');
      const now = new Date().toISOString();
      await tx
        .update(characters)
        .set({
          status: 'archived',
          archiveReason: reason,
          frozenAt: now,
          statusChangedAt: now,
          updatedAt: now,
        })
        .where(eq(characters.id, characterId));
    });
  }

  async archiveCampaignCharacters(campaignId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db
      .update(characters)
      .set({
        status: 'archived',
        archiveReason: 'campaign-deleted',
        frozenAt: now,
        statusChangedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(characters.campaignId, campaignId),
          eq(characters.kind, 'pc'),
          isNull(characters.deletedAt),
        ),
      );
  }

  private isActiveSlotViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
}
