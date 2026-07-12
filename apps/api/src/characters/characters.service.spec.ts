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
