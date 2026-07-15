import { BadRequestException } from '@nestjs/common';
import {
  analyzeBuild,
  calculateDerived,
  getAttributeBudget,
  getClassPowerSlotCount,
  validateBuild,
} from './ordem-ruleset';
import type { RulesetCatalog } from '../rules/rules.service';

const allSkills = [
  'origem-1',
  'origem-2',
  'ocultismo',
  'vontade',
  'luta',
  'pontaria',
  'fortitude',
  'reflexos',
  'acrobacia',
  'artes',
  'atletismo',
  'atualidades',
  'ciencia',
  'crime',
  'diplomacia',
  'enganacao',
  'furtividade',
  'iniciativa',
  'intimidacao',
  'intuicao',
  'investigacao',
  'medicina',
  'percepcao',
  'pilotagem',
  'profissao',
  'religiao',
  'sobrevivencia',
  'tatica',
  'tecnologia',
];

const catalog: RulesetCatalog = {
  version: 'v1',
  name: 'Test rules',
  nex: { min: 5, max: 99, step: 5 },
  origins: [
    {
      slug: 'origin',
      name: 'Origin',
      grantedSkills: ['origem-1', 'origem-2'],
      skillChoices: [],
    },
  ],
  classes: [
    {
      slug: 'combatente',
      name: 'Combatant',
      baseHp: 20,
      hpPerNex: 4,
      baseSan: 12,
      sanPerNex: 3,
      baseEp: 2,
      trainedSkills: 1,
      trainingUpgradeBase: 2,
      grantedSkills: [],
      skillChoices: [
        {
          slug: 'combate-armado',
          selectionCount: 1,
          skills: ['luta', 'pontaria'],
        },
        {
          slug: 'defesa-fisica',
          selectionCount: 1,
          skills: ['fortitude', 'reflexos'],
        },
      ],
      paths: [{ slug: 'combat-path', name: 'Combat path', minNex: 10 }],
    },
    {
      slug: 'especialista',
      name: 'Specialist',
      baseHp: 16,
      hpPerNex: 3,
      baseSan: 16,
      sanPerNex: 4,
      baseEp: 3,
      trainedSkills: 7,
      trainingUpgradeBase: 5,
      grantedSkills: [],
      skillChoices: [],
      paths: [{ slug: 'specialist-path', name: 'Specialist path', minNex: 10 }],
    },
    {
      slug: 'ocultista',
      name: 'Occultist',
      baseHp: 12,
      hpPerNex: 2,
      baseSan: 20,
      sanPerNex: 5,
      baseEp: 4,
      trainedSkills: 3,
      trainingUpgradeBase: 3,
      grantedSkills: ['ocultismo', 'vontade'],
      skillChoices: [],
      paths: [{ slug: 'occultist-path', name: 'Occultist path', minNex: 10 }],
    },
  ],
  skills: allSkills.map((slug) => ({ slug, name: slug })),
  powers: Array.from({ length: 6 }, (_, index) => ({
    slug: `power-${index + 1}`,
    name: `Power ${index + 1}`,
    minNex: 5,
    maxRank: 1,
    requiredClassSlug: null,
  })),
  rituals: [
    {
      slug: 'ritual',
      name: 'Ritual',
      minNex: 25,
      maxRank: 2,
      requiredClassSlug: 'ocultista',
    },
  ],
};

function buildSkills(
  names: string[],
  degree: 'trained' | 'veteran' | 'expert' = 'trained',
) {
  return names.map((name) => ({ name, degree }));
}

function buildClassPowerSelections(nex: number) {
  return Array.from({ length: Math.floor(nex / 15) }, (_, index) => ({
    category: 'power' as const,
    name: `power-${index + 1}`,
    rank: 1,
  }));
}

function valid(
  classSlug: 'combatente' | 'especialista' | 'ocultista' = 'ocultista',
) {
  const skillsByClass = {
    combatente: [
      'origem-1',
      'origem-2',
      'luta',
      'fortitude',
      'acrobacia',
      'artes',
      'atletismo',
    ],
    especialista: [
      'origem-1',
      'origem-2',
      'acrobacia',
      'artes',
      'atletismo',
      'atualidades',
      'ciencia',
      'crime',
      'diplomacia',
      'enganacao',
      'furtividade',
    ],
    ocultista: [
      'origem-1',
      'origem-2',
      'ocultismo',
      'vontade',
      'acrobacia',
      'artes',
      'atletismo',
      'atualidades',
      'ciencia',
    ],
  };
  const pathByClass = {
    combatente: 'combat-path',
    especialista: 'specialist-path',
    ocultista: 'occultist-path',
  };
  return {
    origin: 'origin',
    characterClass: classSlug,
    path: pathByClass[classSlug],
    nex: 25,
    attributes: {
      agility: 3,
      strength: 2,
      intellect: 2,
      presence: 2,
      vigor: 1,
    },
    skills: buildSkills(skillsByClass[classSlug]),
    selections: [
      ...buildClassPowerSelections(25),
      ...(classSlug === 'ocultista'
        ? [{ category: 'ritual' as const, name: 'ritual', rank: 2 }]
        : []),
    ],
    isFinal: true,
  };
}

describe('Ordem Paranormal 1.3 rules', () => {
  it('uses the class-specific base 1.3 skill upgrade limits', () => {
    expect(
      catalog.classes.map(({ slug, trainingUpgradeBase }) => ({
        slug,
        trainingUpgradeBase,
      })),
    ).toEqual([
      { slug: 'combatente', trainingUpgradeBase: 2 },
      { slug: 'especialista', trainingUpgradeBase: 5 },
      { slug: 'ocultista', trainingUpgradeBase: 3 },
    ]);
  });

  it.each(['combatente', 'especialista', 'ocultista'] as const)(
    'accepts the complete %s class skill allocation',
    (characterClass) => {
      expect(() => validateBuild(catalog, valid(characterClass))).not.toThrow();
    },
  );

  it('requires origin skills, class choices, and every Intellect-granted skill', () => {
    const input = valid('combatente');
    input.skills = buildSkills([
      'origem-1',
      'origem-2',
      'pontaria',
      'fortitude',
      'acrobacia',
      'artes',
    ]);
    expect(() => validateBuild(catalog, input)).toThrow(
      'Esta ficha deve treinar exatamente 7 perícias da origem, classe e Intelecto',
    );

    input.skills = buildSkills([
      'origem-1',
      'origem-2',
      'pontaria',
      'reflexos',
      'acrobacia',
      'artes',
      'atletismo',
    ]);
    expect(() => validateBuild(catalog, input)).not.toThrow();
  });

  it('does not let an origin skill satisfy Combatant weapon training', () => {
    const input = valid('combatente');
    catalog.origins[0].grantedSkills = ['pontaria', 'origem-2'];
    input.skills = buildSkills([
      'pontaria',
      'origem-2',
      'fortitude',
      'acrobacia',
      'artes',
      'atletismo',
      'atualidades',
    ]);
    expect(() => validateBuild(catalog, input)).toThrow(
      'Escolha exatamente 1 perícia para combate-armado',
    );
    catalog.origins[0].grantedSkills = ['origem-1', 'origem-2'];
  });

  it('allows a 5% agent to finalize before a path is available', () => {
    const input = valid();
    input.nex = 5;
    input.path = '';
    input.attributes = {
      agility: 3,
      strength: 2,
      intellect: 2,
      presence: 1,
      vigor: 1,
    };
    input.selections = [];
    expect(() => validateBuild(catalog, input)).not.toThrow();
  });

  it('requires a final build to allocate its full attribute budget', () => {
    const input = valid();
    input.attributes = {
      agility: 2,
      strength: 2,
      intellect: 2,
      presence: 2,
      vigor: 1,
    };

    expect(() => validateBuild(catalog, input)).toThrow(
      'A distribuição de atributos para NEX 25% deve totalizar 10; a ficha possui 9',
    );
  });

  it('identifies the attribute that exceeds its NEX-specific cap', () => {
    const input = valid();
    input.nex = 5;
    input.path = '';
    input.selections = [];
    input.attributes = {
      agility: 4,
      strength: 2,
      intellect: 1,
      presence: 1,
      vigor: 1,
    };

    expect(() => validateBuild(catalog, input)).toThrow(
      'Agilidade deve ser um número inteiro entre 0 e 3 para NEX 5%; o valor informado foi 4',
    );
  });

  it('keeps incomplete attribute allocations in drafts', () => {
    const input = valid();
    input.attributes = {
      agility: 0,
      strength: 0,
      intellect: 0,
      presence: 0,
      vigor: 0,
    };
    input.isFinal = false;

    expect(() => validateBuild(catalog, input)).not.toThrow();
  });

  it('rejects NEX-invalid attributes in drafts with the affected field', () => {
    const input = valid();
    input.nex = 5;
    input.path = '';
    input.selections = [];
    input.attributes = {
      agility: 4,
      strength: 2,
      intellect: 1,
      presence: 1,
      vigor: 1,
    };
    input.isFinal = false;

    try {
      validateBuild(catalog, input);
      throw new Error('Expected validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toMatchObject({
        field: 'agility',
      });
    }
  });

  it.each([20, 50, 80, 95, 99])(
    'applies the correct attribute budget at NEX %i',
    (nex) => {
      const expected = new Map([
        [20, 10],
        [50, 11],
        [80, 12],
        [95, 13],
        [99, 13],
      ]);
      expect(getAttributeBudget(catalog, nex)).toBe(expected.get(nex));
    },
  );

  it('allows the special terminal 99% NEX value', () => {
    const input = valid();
    input.nex = 99;
    input.attributes = {
      agility: 3,
      strength: 3,
      intellect: 3,
      presence: 2,
      vigor: 2,
    };
    input.skills = buildSkills([
      'origem-1',
      'origem-2',
      'ocultismo',
      'vontade',
      'acrobacia',
      'artes',
      'atletismo',
      'atualidades',
      'ciencia',
      'crime',
    ]);
    input.selections = [
      ...buildClassPowerSelections(99),
      { category: 'ritual', name: 'ritual', rank: 2 },
    ];
    expect(() => validateBuild(catalog, input)).not.toThrow();
    expect(
      calculateDerived(catalog, 'ocultista', 99, input.attributes),
    ).toMatchObject({ epLimit: 20 });
  });

  it('calculates SAN from Presence at creation and every NEX advance', () => {
    const derived = calculateDerived(catalog, 'ocultista', 10, {
      agility: 1,
      strength: 1,
      intellect: 1,
      presence: 3,
      vigor: 2,
    });
    expect(derived).toMatchObject({
      maxHp: 18,
      maxSan: 31,
      maxEp: 14,
      epLimit: 2,
    });
  });

  it.each([
    [34, 'veteran'],
    [35, 'veteran'],
    [69, 'expert'],
    [70, 'expert'],
  ] as const)(
    'enforces NEX %i training threshold for %s skills',
    (nex, degree) => {
      const input = valid('especialista');
      input.nex = nex;
      input.attributes =
        nex >= 50
          ? { agility: 3, strength: 2, intellect: 2, presence: 2, vigor: 2 }
          : { agility: 2, strength: 2, intellect: 2, presence: 2, vigor: 2 };
      input.skills = buildSkills(input.skills.map((skill) => skill.name));
      input.selections = buildClassPowerSelections(nex);
      input.skills[0].degree = degree;
      const shouldPass =
        (degree === 'veteran' && nex >= 35) ||
        (degree === 'expert' && nex >= 70);
      if (shouldPass) expect(() => validateBuild(catalog, input)).not.toThrow();
      else
        expect(() => validateBuild(catalog, input)).toThrow(
          BadRequestException,
        );
    },
  );

  it('counts an expert as two of the NEX 70 training upgrades', () => {
    const input = valid('especialista');
    input.nex = 70;
    input.attributes = {
      agility: 3,
      strength: 2,
      intellect: 2,
      presence: 2,
      vigor: 2,
    };
    input.skills = input.skills.map((skill, index) => ({
      ...skill,
      degree: index < 4 ? ('expert' as const) : ('trained' as const),
    }));
    expect(() => validateBuild(catalog, input)).toThrow(
      'Esta ficha pode aplicar no máximo 7 melhorias de treinamento em perícias',
    );
  });

  it('rejects a ritual whose configured NEX is not reached', () => {
    const input = valid();
    input.nex = 20;
    expect(() => validateBuild(catalog, input)).toThrow(BadRequestException);
  });

  it.each([
    [5, 0],
    [10, 0],
    [15, 1],
    [25, 1],
    [30, 2],
    [90, 6],
    [99, 6],
  ])('provides %i class power slots at NEX %i%%', (nex, expectedSlots) => {
    expect(getClassPowerSlotCount(catalog, nex)).toBe(expectedSlots);
  });

  it('requires exactly the class power slots unlocked by NEX', () => {
    const input = valid('combatente');
    input.selections = [];
    expect(() => validateBuild(catalog, input)).toThrow(
      'Esta ficha deve selecionar exatamente 1 poder de classe para NEX 25%',
    );

    input.selections = [
      ...buildClassPowerSelections(25),
      { category: 'power', name: 'power-2', rank: 1 },
    ];
    expect(() => validateBuild(catalog, input)).toThrow(
      'Esta ficha deve selecionar exatamente 1 poder de classe para NEX 25%',
    );
  });

  it('reports every retained-build conflict after reducing NEX', () => {
    const input = valid('especialista');
    input.nex = 5;
    input.attributes = {
      agility: 5,
      strength: 3,
      intellect: 2,
      presence: 2,
      vigor: 2,
    };
    input.path = 'specialist-path';
    input.skills = [
      ...buildSkills([
        'origem-1',
        'origem-2',
        'acrobacia',
        'artes',
        'atletismo',
        'atualidades',
        'ciencia',
        'crime',
        'diplomacia',
        'enganacao',
        'furtividade',
      ]),
      { name: 'origem-1', degree: 'expert' },
    ];
    input.selections = [
      ...buildClassPowerSelections(30),
      { category: 'power', name: 'power-3', rank: 1 },
    ];
    catalog.powers[2].minNex = 30;

    const conflicts = analyzeBuild(catalog, input);

    catalog.powers[2].minNex = 5;

    expect(conflicts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'INVALID_ATTRIBUTE_VALUE',
          field: 'agility',
        }),
        expect.objectContaining({
          code: 'ATTRIBUTE_BUDGET_EXCEEDED',
          field: 'attributes',
        }),
        expect.objectContaining({
          code: 'INVALID_PATH',
          field: 'path',
          optionId: 'specialist-path',
        }),
        expect.objectContaining({
          code: 'SKILL_DEGREE_NEX_REQUIREMENT',
          field: 'skills',
          optionId: 'origem-1',
        }),
        expect.objectContaining({
          code: 'DUPLICATE_SKILL',
          field: 'skills',
          optionId: 'origem-1',
        }),
        expect.objectContaining({
          code: 'UNAVAILABLE_SELECTION',
          field: 'selections',
          optionId: 'power-3',
        }),
        expect.objectContaining({
          code: 'POWER_SLOT_COUNT_MISMATCH',
          field: 'selections',
        }),
      ]),
    );
  });

  it('preserves the legacy validator behavior while exposing non-throwing conflicts', () => {
    const input = valid('combatente');
    input.nex = 5;
    input.path = '';
    input.selections = [{ category: 'power', name: 'power-1', rank: 1 }];

    expect(() => validateBuild(catalog, input)).toThrow(BadRequestException);
    expect(analyzeBuild(catalog, input)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'POWER_SLOT_COUNT_MISMATCH' }),
      ]),
    );
  });
});
