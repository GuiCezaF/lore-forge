import { BadRequestException } from '@nestjs/common';
import { validateBuild } from './ordem-ruleset';
import type { RulesetCatalog } from '../rules/rules.service';

const catalog: RulesetCatalog = {
  version: 'v1', name: 'Test rules', nex: { min: 5, max: 99, step: 5 },
  origins: [{ slug: 'origin', name: 'Origin' }],
  classes: [{ slug: 'ocultista', name: 'Occultist', baseHp: 12, hpPerNex: 2, baseSan: 20, baseEp: 4, trainedSkills: 3, paths: [{ slug: 'path', name: 'Path', minNex: 10 }] }],
  skills: [{ slug: 'ocultismo', name: 'Occultism' }],
  powers: [{ slug: 'power', name: 'Power', minNex: 5, maxRank: 1, requiredClassSlug: null }],
  rituals: [{ slug: 'ritual', name: 'Ritual', minNex: 25, maxRank: 2, requiredClassSlug: 'ocultista' }],
};

const valid = () => ({
  origin: 'origin', characterClass: 'ocultista', path: 'path', nex: 25,
  attributes: { agility: 1, strength: 1, intellect: 1, presence: 1, vigor: 1 },
  skills: [{ name: 'ocultismo', degree: 'trained' as const }],
  selections: [{ category: 'ritual' as const, name: 'ritual', rank: 2 }], isFinal: true,
});

describe('validateBuild rule-catalog selections', () => {
  it('accepts a catalog ritual available to the selected class and NEX', () => {
    expect(() => validateBuild(catalog, valid())).not.toThrow();
  });

  it('rejects an option whose configured NEX is not reached', () => {
    const input = valid(); input.nex = 20;
    expect(() => validateBuild(catalog, input)).toThrow(BadRequestException);
  });

  it('rejects a rank outside the database catalog maximum', () => {
    const input = valid(); input.selections[0].rank = 3;
    expect(() => validateBuild(catalog, input)).toThrow('Selection rank is not available');
  });

  it('rejects a runtime category outside the explicit rule option kinds', () => {
    const input = valid(); (input.selections[0] as { category: string }).category = 'feature';
    expect(() => validateBuild(catalog, input)).toThrow('Selection category must be power or ritual');
  });

  it('allows a 5% agent to finalize before any catalog path is available', () => {
    const input = valid();
    input.nex = 5;
    input.path = undefined;
    input.selections = [];
    expect(() => validateBuild(catalog, input)).not.toThrow();
  });
});
