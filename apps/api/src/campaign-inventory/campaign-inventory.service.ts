import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import {
  campaignMembers,
  campaigns,
  characterInventory,
  characters,
  items,
} from '../database/schema';
import {
  parseCreateInventoryInput,
  parseUpdateInventoryInput,
} from './campaign-inventory.parsers';
import type {
  CampaignInventoryDto,
  CampaignInventoryEntryDto,
} from './campaign-inventory.dto';

@Injectable()
export class CampaignInventoryService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async list(
    userId: string,
    characterId: string,
  ): Promise<CampaignInventoryDto> {
    const access = await this.resolveAccess(userId, characterId);
    const rows = await this.db
      .select()
      .from(characterInventory)
      .where(eq(characterInventory.characterId, characterId))
      .orderBy(asc(characterInventory.createdAt), asc(characterInventory.id));
    const mapped = rows.map((row) => this.toDto(row, access.isManager));
    const used = mapped.reduce((total, item) => total + item.totalSpace, 0);
    const capacity = access.character.carryCapacity ?? 0;
    return {
      load: {
        capacity,
        used,
        excess: Math.max(used - capacity, 0),
        isOverloaded: used > capacity,
      },
      items: mapped,
    };
  }

  async create(
    userId: string,
    characterId: string,
    body: unknown,
  ): Promise<CampaignInventoryEntryDto> {
    const access = await this.resolveManagerMutation(userId, characterId);
    const input = parseCreateInventoryInput(body);
    let name: string;
    let spacePerUnit: number;
    let itemId: string | null = null;
    if ('sourceItemId' in input) {
      const [item] = await this.db
        .select()
        .from(items)
        .where(and(eq(items.id, input.sourceItemId), isNull(items.deletedAt)));
      if (
        !item ||
        item.kind !== 'item' ||
        !this.isEligibleCatalogItem(item, userId, access.character.campaignId!)
      )
        throw new BadRequestException('Invalid inventory catalog item');
      name = item.name;
      spacePerUnit = item.space;
      itemId = item.id;
    } else {
      name = input.name;
      spacePerUnit = input.spacePerUnit;
    }
    const [row] = await this.db
      .insert(characterInventory)
      .values({
        characterId,
        itemId,
        name,
        spacePerUnit,
        quantity: input.quantity,
        isEquipped: input.isEquipped,
        visibleNotes: input.visibleNotes,
        gmNotes: input.gmNotes,
        addedByUserId: userId,
      })
      .returning();
    return this.toDto(row, true);
  }

  async update(
    userId: string,
    characterId: string,
    inventoryId: string,
    body: unknown,
  ): Promise<CampaignInventoryEntryDto> {
    await this.resolveManagerMutation(userId, characterId);
    const input = parseUpdateInventoryInput(body);
    const [row] = await this.db
      .update(characterInventory)
      .set({ ...input, updatedAt: new Date().toISOString() })
      .where(
        and(
          eq(characterInventory.id, inventoryId),
          eq(characterInventory.characterId, characterId),
        ),
      )
      .returning();
    if (!row) throw new NotFoundException('Inventory entry not found');
    return this.toDto(row, true);
  }

  async remove(
    userId: string,
    characterId: string,
    inventoryId: string,
  ): Promise<void> {
    await this.resolveManagerMutation(userId, characterId);
    const deleted = await this.db
      .delete(characterInventory)
      .where(
        and(
          eq(characterInventory.id, inventoryId),
          eq(characterInventory.characterId, characterId),
        ),
      )
      .returning({ id: characterInventory.id });
    if (!deleted.length)
      throw new NotFoundException('Inventory entry not found');
  }

  private async resolveAccess(userId: string, characterId: string) {
    const [character] = await this.db
      .select()
      .from(characters)
      .where(and(eq(characters.id, characterId), isNull(characters.deletedAt)));
    if (!character) throw new NotFoundException('Character not found');
    if (character.kind !== 'pc' || !character.campaignId)
      throw new BadRequestException('Only Campaign Characters have inventory');
    const isManager = character.campaignId
      ? await this.isManager(userId, character.campaignId)
      : false;
    if (isManager) return { character, isManager };
    if (character.ownerUserId === userId) {
      if (
        character.status !== 'active' ||
        !(await this.hasMembership(userId, character.campaignId))
      )
        throw new ForbiddenException('Cannot access this campaign inventory');
      return { character, isManager: false };
    }
    throw new NotFoundException('Character not found');
  }

  private async resolveManagerMutation(userId: string, characterId: string) {
    const access = await this.resolveAccess(userId, characterId);
    if (!access.isManager)
      throw new ForbiddenException('Only the campaign GM can manage inventory');
    if (access.character.status !== 'active')
      throw new ConflictException(
        'Only active Campaign Characters can change inventory',
      );
    return access;
  }

  private async isManager(
    userId: string,
    campaignId: string,
  ): Promise<boolean> {
    const [campaign] = await this.db
      .select({ ownerUserId: campaigns.ownerUserId })
      .from(campaigns)
      .where(and(eq(campaigns.id, campaignId), isNull(campaigns.deletedAt)));
    return campaign?.ownerUserId === userId;
  }

  private async hasMembership(
    userId: string,
    campaignId: string,
  ): Promise<boolean> {
    const [membership] = await this.db
      .select({ userId: campaignMembers.userId })
      .from(campaignMembers)
      .where(
        and(
          eq(campaignMembers.campaignId, campaignId),
          eq(campaignMembers.userId, userId),
        ),
      );
    return Boolean(membership);
  }

  private isEligibleCatalogItem(
    item: typeof items.$inferSelect,
    userId: string,
    campaignId: string,
  ): boolean {
    return (
      item.scope === 'system' ||
      item.ownerUserId === userId ||
      item.campaignId === campaignId
    );
  }

  private toDto(
    row: typeof characterInventory.$inferSelect,
    includeGmNotes: boolean,
  ): CampaignInventoryEntryDto {
    const entry: CampaignInventoryEntryDto = {
      id: row.id,
      name: row.name,
      quantity: row.quantity,
      spacePerUnit: row.spacePerUnit,
      totalSpace: row.quantity * row.spacePerUnit,
      isEquipped: row.isEquipped,
      visibleNotes: row.visibleNotes ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    if (includeGmNotes) entry.gmNotes = row.gmNotes ?? null;
    return entry;
  }
}
