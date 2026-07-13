import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CharactersService } from './characters.service';

const userId = '00000000-0000-4000-8000-000000000001';
const campaignId = '00000000-0000-4000-8000-000000000002';

function createSelectDatabase(rows: unknown[]) {
  return {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn().mockResolvedValue(rows),
      })),
    })),
  };
}

describe('CharactersService campaign ownership rules', () => {
  it('lists NPCs only from campaigns managed by the current GM', async () => {
    const npc = {
      id: '00000000-0000-4000-8000-000000000004',
      ownerUserId: userId,
      campaignId,
      kind: 'npc',
      deletedAt: null,
    };
    const campaignsService = {
      getCampaign: jest.fn().mockResolvedValue({
        ownerUserId: userId,
        members: [{ userId, role: 'gm' }],
      }),
    };
    const service = new CharactersService(
      createSelectDatabase([npc]) as never,
      campaignsService as never,
      {} as never,
      {} as never,
    );

    await expect(service.listNpcsForGm(userId)).resolves.toEqual([
      expect.objectContaining({ id: npc.id, kind: 'npc' }),
    ]);
  });

  it('does not list NPCs from campaigns where the user is a player', async () => {
    const npc = {
      id: '00000000-0000-4000-8000-000000000004',
      ownerUserId: userId,
      campaignId,
      kind: 'npc',
      deletedAt: null,
    };
    const campaignsService = {
      getCampaign: jest.fn().mockResolvedValue({
        ownerUserId: '00000000-0000-4000-8000-000000000003',
        members: [{ userId, role: 'player' }],
      }),
    };
    const service = new CharactersService(
      createSelectDatabase([npc]) as never,
      campaignsService as never,
      {} as never,
      {} as never,
    );

    await expect(service.listNpcsForGm(userId)).resolves.toEqual([]);
  });

  it('includes saved skills and class powers in a character detail response', async () => {
    const character = {
      id: '00000000-0000-4000-8000-000000000004',
      ownerUserId: userId,
      campaignId: null,
      sourceCharacterId: null,
      kind: 'pc',
      status: 'active',
      npcMode: null,
      sheetLabel: null,
      rulesetVersion: 'op-rpg-1.3',
      name: 'Agente',
      concept: null,
      origin: 'academico',
      characterClass: 'combatente',
      path: null,
      nex: 15,
      agility: 1,
      strength: 1,
      intellect: 1,
      presence: 1,
      vigor: 1,
      maxHp: 30,
      maxSan: 20,
      maxEp: 2,
      epLimit: 2,
      defense: 10,
      dodge: 10,
      block: 1,
      movement: 9,
      carryCapacity: 10,
      imageAssetId: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      deletedAt: null,
    };
    const detailDatabase = {
      select: jest.fn((fields?: unknown) => ({
        from: jest.fn(() => ({
          where: jest.fn(() => fields
            ? { orderBy: jest.fn().mockResolvedValue(
              'degree' in (fields as Record<string, unknown>)
                ? [{ name: 'ciencia', degree: 'trained' }]
                : [{ category: 'power', name: 'golpe-pesado', rank: 1 }, { category: 'ritual', name: 'cicatrizacao', rank: 1 }],
            ) }
            : Promise.resolve([character])),
        })),
      })),
    };
    const service = new CharactersService(
      detailDatabase as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.getCharacter(userId, character.id)).resolves.toMatchObject({
      skills: [{ name: 'ciencia', degree: 'trained' }],
      powers: [{ name: 'golpe-pesado', rank: 1 }],
    });
  });

  it('rejects NPC creation by a non-GM campaign member', async () => {
    const campaignsService = {
      getCampaign: jest.fn().mockResolvedValue({
        ownerUserId: '00000000-0000-4000-8000-000000000003',
        members: [{ userId, role: 'player' }],
      }),
    };
    const service = new CharactersService(
      createSelectDatabase([]) as never,
      campaignsService as never,
      {} as never,
      {} as never,
    );

    await expect(service.createNpc(userId, campaignId, { name: 'Unapproved NPC' }))
      .rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not expose campaign play state for NPCs', async () => {
    const npc = {
      id: '00000000-0000-4000-8000-000000000004',
      ownerUserId: userId,
      campaignId,
      kind: 'npc',
      deletedAt: null,
    };
    const service = new CharactersService(
      createSelectDatabase([npc]) as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.getCampaignPlayState(userId, npc.id))
      .rejects.toBeInstanceOf(BadRequestException);
  });
});
