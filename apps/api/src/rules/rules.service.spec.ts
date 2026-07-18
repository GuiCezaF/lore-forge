import { NotFoundException } from '@nestjs/common';
import { RulesService } from './rules.service';

describe('RulesService', () => {
  const createService = (rows: unknown[][]) => {
    let call = 0;
    const db = {
      select: jest.fn(() => ({
        from: jest.fn(() => ({ where: jest.fn(async () => rows[call++]) })),
      })),
    };
    return new RulesService(db as never);
  };

  it('builds a catalog entirely from stored rule records', async () => {
    const service = createService([
      [{ version: 'v1', name: 'Rules', minNex: 5, maxNex: 99, nexStep: 5 }],
      [
        {
          id: 'class-1',
          slug: 'custom',
          name: 'Custom',
          baseHp: 1,
          hpPerNex: 2,
          baseSan: 3,
          sanPerNex: 4,
          baseEp: 4,
          trainedSkills: 5,
          trainingUpgradeBase: 3,
        },
      ],
      [{ classId: 'class-1', slug: 'path', name: 'Path', minNex: 10 }],
      [{ id: 'origin-1', slug: 'origin', name: 'Origin' }],
      [{ slug: 'skill', name: 'Skill' }],
      [
        {
          kind: 'power',
          slug: 'power',
          name: 'Power',
          minNex: 5,
          maxRank: 1,
          requiredClassSlug: null,
        },
      ],
      [{ classId: 'class-1', skillSlug: 'will' }],
      [
        {
          classId: 'class-1',
          groupSlug: 'weapons',
          skillSlug: 'fight',
          selectionCount: 1,
        },
      ],
      [
        { originId: 'origin-1', skillSlug: 'observe' },
        { originId: 'another-origin', skillSlug: 'must-not-leak' },
      ],
      [
        {
          originId: 'origin-1',
          groupSlug: 'background',
          skillSlug: 'craft',
          selectionCount: 1,
        },
        {
          originId: 'origin-1',
          groupSlug: 'background',
          skillSlug: 'art',
          selectionCount: 1,
        },
        {
          originId: 'another-origin',
          groupSlug: 'other',
          skillSlug: 'must-not-leak',
          selectionCount: 1,
        },
      ],
    ]);
    await expect(service.getCatalog('v1')).resolves.toMatchObject({
      classes: [
        {
          slug: 'custom',
          grantedSkills: ['will'],
          skillChoices: [{ slug: 'weapons', skills: ['fight'] }],
          paths: [{ slug: 'path' }],
        },
      ],
      origins: [
        {
          slug: 'origin',
          grantedSkills: ['observe'],
          skillChoices: [
            { slug: 'background', selectionCount: 1, skills: ['craft', 'art'] },
          ],
        },
      ],
      powers: [{ slug: 'power' }],
    });
  });

  it('rejects unknown rulesets', async () => {
    const service = createService([[]]);
    await expect(service.getCatalog('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
