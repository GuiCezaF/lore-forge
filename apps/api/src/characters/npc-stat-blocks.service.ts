import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import {
  npcAbilities,
  npcAttacks,
  npcResistances,
  npcStatBlocks,
} from '../database/schema';
import type { NpcStatBlockInput } from './characters.service';

@Injectable()
export class NpcStatBlocksService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async get(characterId: string) {
    const [[statBlock], attacks, resistances, abilities] = await Promise.all([
      this.db
        .select()
        .from(npcStatBlocks)
        .where(eq(npcStatBlocks.characterId, characterId)),
      this.db
        .select()
        .from(npcAttacks)
        .where(eq(npcAttacks.characterId, characterId))
        .orderBy(asc(npcAttacks.sortOrder)),
      this.db
        .select()
        .from(npcResistances)
        .where(eq(npcResistances.characterId, characterId)),
      this.db
        .select()
        .from(npcAbilities)
        .where(eq(npcAbilities.characterId, characterId))
        .orderBy(asc(npcAbilities.sortOrder)),
    ]);
    return { statBlock: statBlock ?? null, attacks, resistances, abilities };
  }

  async replace(characterId: string, input: NpcStatBlockInput): Promise<void> {
    const numbers = {
      threatLevel: input.threatLevel ?? 0,
      hp: input.hp ?? 1,
      defense: input.defense ?? 10,
      fortitude: input.fortitude ?? 0,
      reflex: input.reflex ?? 0,
      will: input.will ?? 0,
      perception: input.perception ?? 0,
      movement: input.movement ?? 9,
    };
    for (const [key, value] of Object.entries(numbers))
      if (!Number.isInteger(value) || value < 0)
        throw new BadRequestException(`${key} must be a non-negative integer`);
    const attacks = input.attacks ?? [];
    const resistances = (input.resistances ?? []).map((entry) => ({
      damageType: (entry.damageType ?? entry.type ?? '').trim(),
      value:
        typeof entry.value === 'string'
          ? Number(entry.value)
          : (entry.value ?? 0),
      kind: entry.kind ?? 'resistance',
    }));
    const abilities = input.abilities ?? [];
    if (attacks.some((entry) => !entry.name.trim()))
      throw new BadRequestException('NPC attacks require a name');
    if (
      resistances.some(
        (entry) => !entry.damageType || !Number.isInteger(entry.value),
      )
    )
      throw new BadRequestException(
        'NPC resistances require a type and integer value',
      );
    if (
      abilities.some((entry) => !entry.name.trim() || !entry.description.trim())
    )
      throw new BadRequestException(
        'NPC abilities require a name and description',
      );
    const size = input.size?.trim() || 'medium';
    await this.db.transaction(async (tx) => {
      await tx
        .insert(npcStatBlocks)
        .values({
          characterId,
          ...numbers,
          size,
          senses: input.senses?.trim() || null,
          notes: input.notes?.trim() || null,
          updatedAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: npcStatBlocks.characterId,
          set: {
            ...numbers,
            size,
            senses: input.senses?.trim() || null,
            notes: input.notes?.trim() || null,
            updatedAt: new Date().toISOString(),
          },
        });
      await Promise.all([
        tx.delete(npcAttacks).where(eq(npcAttacks.characterId, characterId)),
        tx
          .delete(npcResistances)
          .where(eq(npcResistances.characterId, characterId)),
        tx
          .delete(npcAbilities)
          .where(eq(npcAbilities.characterId, characterId)),
      ]);
      if (attacks.length)
        await tx
          .insert(npcAttacks)
          .values(
            attacks.map((entry, sortOrder) => ({
              characterId,
              name: entry.name.trim(),
              test: entry.test?.trim() || null,
              damage: entry.damage?.trim() || null,
              range: entry.range?.trim() || null,
              critical: entry.critical?.trim() || null,
              effect: entry.effect?.trim() || null,
              sortOrder,
            })),
          );
      if (resistances.length)
        await tx
          .insert(npcResistances)
          .values(resistances.map((entry) => ({ characterId, ...entry })));
      if (abilities.length)
        await tx
          .insert(npcAbilities)
          .values(
            abilities.map((entry, sortOrder) => ({
              characterId,
              name: entry.name.trim(),
              description: entry.description.trim(),
              actionCost: entry.actionCost?.trim() || null,
              sortOrder,
            })),
          );
    });
  }

  async clear(characterId: string): Promise<void> {
    await this.db
      .delete(npcStatBlocks)
      .where(eq(npcStatBlocks.characterId, characterId));
  }
}
