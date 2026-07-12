import { NotFoundException } from '@nestjs/common';
import { RulesService } from './rules.service';

describe('RulesService', () => {
  const createService = (rows: unknown[][]) => {
    let call = 0;
    const db = {
      select: jest.fn(() => ({ from: jest.fn(() => ({ where: jest.fn(async () => rows[call++]) })) })),
    };
    return new RulesService(db as never);
  };

  it('builds a catalog entirely from stored rule records', async () => {
    const service = createService([
      [{ version: 'v1', name: 'Rules', minNex: 5, maxNex: 99, nexStep: 5 }],
      [{ id: 'class-1', slug: 'custom', name: 'Custom', baseHp: 1, hpPerNex: 2, baseSan: 3, baseEp: 4, trainedSkills: 5 }],
      [{ classId: 'class-1', slug: 'path', name: 'Path', minNex: 10 }],
      [{ slug: 'origin', name: 'Origin' }], [{ slug: 'skill', name: 'Skill' }],
      [{ kind: 'power', slug: 'power', name: 'Power', minNex: 5, maxRank: 1, requiredClassSlug: null }],
    ]);
    await expect(service.getCatalog('v1')).resolves.toMatchObject({ classes: [{ slug: 'custom', paths: [{ slug: 'path' }] }], origins: [{ slug: 'origin' }], powers: [{ slug: 'power' }] });
  });

  it('rejects unknown rulesets', async () => {
    const service = createService([[]]);
    await expect(service.getCatalog('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
