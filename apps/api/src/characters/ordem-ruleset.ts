import { BadRequestException } from '@nestjs/common';
import type { RulesetCatalog, SkillChoiceGroup } from '../rules/rules.service';

export type SkillDegree = 'trained' | 'veteran' | 'expert';
export interface CharacterAttributes { agility: number; strength: number; intellect: number; presence: number; vigor: number; }
export interface CharacterSelectionInput { category: 'power' | 'ritual'; name: string; rank?: number; }
export interface CharacterSkillInput { name: string; degree?: SkillDegree; }
export interface CharacterDerived { maxHp: number; maxSan: number; maxEp: number; epLimit: number; defense: number; dodge: number; block: number; movement: number; carryCapacity: number; }

const MIN_ATTRIBUTE = 0;
const MAX_ATTRIBUTE = 5;
const INITIAL_ATTRIBUTE_TOTAL = 9;
const ATTRIBUTE_NEX_BONUSES = [20, 50, 80, 95] as const;
const INITIAL_ATTRIBUTE_VALUE_CAP = 3;
const ATTRIBUTE_LABELS: Record<keyof CharacterAttributes, string> = {
  agility: 'Agilidade',
  strength: 'Força',
  intellect: 'Intelecto',
  presence: 'Presença',
  vigor: 'Vigor',
};

export function calculateDerived(catalog: RulesetCatalog, classSlug: string, nex: number, attributes: CharacterAttributes): CharacterDerived {
  validateNex(catalog, nex);
  validateAttributes(catalog, nex, attributes);
  const characterClass = catalog.classes.find((value) => value.slug === classSlug);
  if (!characterClass) throw new BadRequestException('Escolha uma classe válida');
  const advances = getNexAdvances(catalog, nex);
  return {
    maxHp: characterClass.baseHp + attributes.vigor + advances * (characterClass.hpPerNex + attributes.vigor),
    maxSan: characterClass.baseSan + attributes.presence + advances * (characterClass.sanPerNex + attributes.presence),
    maxEp: characterClass.baseEp + attributes.presence + advances * (characterClass.baseEp + attributes.presence),
    epLimit: advances + 1, defense: 10 + attributes.agility,
    dodge: attributes.agility, block: attributes.strength, movement: 9,
    carryCapacity: 5 + attributes.strength * 5,
  };
}

export function validateBuild(catalog: RulesetCatalog, input: { origin?: string | null; characterClass?: string | null; path?: string | null; nex: number; attributes: CharacterAttributes; skills?: CharacterSkillInput[]; selections?: CharacterSelectionInput[]; isFinal?: boolean }): void {
  // A draft is intentionally allowed to be incomplete (or temporarily
  // inconsistent after changing class/NEX). It must still remain structurally
  // valid so an auto-save cannot persist attributes outside the selected NEX.
  validateNex(catalog, input.nex);
  validateAttributes(catalog, input.nex, input.attributes);
  // The finalization endpoint runs the complete validation below. This lets
  // drafts remain incomplete while preventing invalid persisted values.
  if (!input.isFinal) return;
  const attributeTotal = getAttributeTotal(input.attributes);
  const attributeBudget = getAttributeBudget(catalog, input.nex);
  if (attributeTotal !== attributeBudget) {
    throw new BadRequestException(
      `A distribuição de atributos para NEX ${input.nex}% deve totalizar ${attributeBudget}; a ficha possui ${attributeTotal}`,
    );
  }
  if (!input.origin || !catalog.origins.some((origin) => origin.slug === input.origin)) throw new BadRequestException('Escolha uma origem válida');
  const characterClass = catalog.classes.find((value) => value.slug === input.characterClass);
  if (!characterClass) throw new BadRequestException('Escolha uma classe válida');
  const availablePaths = characterClass.paths.filter((value) => input.nex >= value.minNex);
  const path = characterClass.paths.find((value) => value.slug === input.path);
  // A newly created 5% agent has not selected a path yet. Once a path is
  // available for the chosen NEX, final builds must select one from the
  // catalog; this keeps the rule data authoritative without making 5% sheets
  // impossible to finalize.
  if (
    (availablePaths.length > 0 && (!path || input.nex < path.minNex)) ||
    (input.path && (!path || input.nex < path.minNex))
  ) {
    throw new BadRequestException('Escolha uma trilha válida para a classe e o NEX selecionados');
  }
  const origin = catalog.origins.find((value) => value.slug === input.origin);
  if (!origin) throw new BadRequestException('Escolha uma origem válida');
  validateSkills(catalog, input.skills ?? [], input.nex, origin, characterClass, input.attributes.intellect);
  validateSelections(catalog, input.selections ?? [], input.nex, characterClass.slug);
}

function validateNex(catalog: RulesetCatalog, nex: number): void {
  const isTerminalNex = nex === catalog.nex.max;
  if (!Number.isInteger(nex) || nex < catalog.nex.min || nex > catalog.nex.max || (!isTerminalNex && nex % catalog.nex.step !== 0)) throw new BadRequestException(`O NEX deve ser múltiplo de ${catalog.nex.step} entre ${catalog.nex.min} e ${catalog.nex.max}, ou o valor final`);
}

function getNexAdvances(catalog: RulesetCatalog, nex: number): number {
  if (nex === catalog.nex.max && nex % catalog.nex.step !== 0) {
    return Math.ceil((nex - catalog.nex.min) / catalog.nex.step);
  }
  return (nex - catalog.nex.min) / catalog.nex.step;
}

function validateAttributes(catalog: RulesetCatalog, nex: number, attributes: CharacterAttributes): void {
  const maxValue = getMaxAttributeValue(catalog, nex);
  for (const [attribute, value] of Object.entries(attributes) as Array<[keyof CharacterAttributes, number]>) {
    if (!Number.isInteger(value) || value < MIN_ATTRIBUTE || value > maxValue) {
      throw new BadRequestException({
        field: attribute,
        message: `${ATTRIBUTE_LABELS[attribute]} deve ser um número inteiro entre ${MIN_ATTRIBUTE} e ${maxValue} para NEX ${nex}%; o valor informado foi ${value}`,
      });
    }
  }
  const attributeTotal = getAttributeTotal(attributes);
  const attributeBudget = getAttributeBudget(catalog, nex);
  if (attributeTotal > attributeBudget) {
    throw new BadRequestException({
      field: 'attributes',
      message: `A distribuição de atributos para NEX ${nex}% permite ${attributeBudget} pontos; a ficha possui ${attributeTotal}`,
    });
  }
}

export function getAttributeBudget(catalog: RulesetCatalog, nex: number): number {
  validateNex(catalog, nex);
  return INITIAL_ATTRIBUTE_TOTAL + ATTRIBUTE_NEX_BONUSES.filter((threshold) => nex >= threshold).length;
}

export function getMaxAttributeValue(catalog: RulesetCatalog, nex: number): number {
  validateNex(catalog, nex);
  return Math.min(MAX_ATTRIBUTE, INITIAL_ATTRIBUTE_VALUE_CAP + ATTRIBUTE_NEX_BONUSES.filter((threshold) => nex >= threshold).length);
}

function getAttributeTotal(attributes: CharacterAttributes): number {
  return Object.values(attributes).reduce((total, value) => total + value, 0);
}

function validateSkills(
  catalog: RulesetCatalog,
  skills: CharacterSkillInput[],
  nex: number,
  origin: RulesetCatalog['origins'][number],
  characterClass: RulesetCatalog['classes'][number],
  intellect: number,
): void {
  const names = new Set<string>(); let veteran = 0; let expert = 0;
  for (const skill of skills) {
    if (!catalog.skills.some((value) => value.slug === skill.name)) throw new BadRequestException(`Perícia desconhecida: ${skill.name}`);
    if (names.has(skill.name)) throw new BadRequestException(`Uma perícia só pode ser selecionada uma vez: ${skill.name}`);
    names.add(skill.name); const degree = skill.degree ?? 'trained';
    if (!['trained', 'veteran', 'expert'].includes(degree)) throw new BadRequestException('Grau de treinamento de perícia inválido');
    if (degree === 'veteran') {
      if (nex < 35) throw new BadRequestException('Perícias veteranas exigem NEX 35');
      veteran += 1;
    }
    if (degree === 'expert') {
      if (nex < 70) throw new BadRequestException('Perícias expert exigem NEX 70');
      expert += 1;
    }
  }
  const grantedSkills = new Set([...origin.grantedSkills, ...characterClass.grantedSkills]);
  for (const skill of grantedSkills) {
    if (!names.has(skill)) throw new BadRequestException(`A origem ou classe selecionada concede a perícia ${skill}`);
  }

  const selectedSkills = new Set(grantedSkills);
  const originChoiceCount = validateSkillChoiceGroups(origin.skillChoices, names, selectedSkills);
  const classChoiceCount = validateSkillChoiceGroups(characterClass.skillChoices, names, selectedSkills);
  const requiredSkillCount = grantedSkills.size + originChoiceCount + classChoiceCount + characterClass.trainedSkills + intellect;
  if (skills.length !== requiredSkillCount) {
    throw new BadRequestException(`Esta ficha deve treinar exatamente ${requiredSkillCount} perícias da origem, classe e Intelecto`);
  }

  const trainingUpgradeLimit = characterClass.trainingUpgradeBase + intellect;
  const trainingUpgradeCount = veteran + expert * 2;
  if (trainingUpgradeCount > trainingUpgradeLimit) {
    throw new BadRequestException(`Esta ficha pode aplicar no máximo ${trainingUpgradeLimit} melhorias de treinamento em perícias`);
  }
}

function validateSkillChoiceGroups(
  groups: SkillChoiceGroup[],
  selectedNames: Set<string>,
  unavailableSkills: Set<string>,
): number {
  let choiceCount = 0;
  for (const group of groups) {
    const selected = group.skills.filter((skill) => selectedNames.has(skill) && !unavailableSkills.has(skill));
    if (selected.length !== group.selectionCount) {
      throw new BadRequestException(`Escolha exatamente ${group.selectionCount} perícia${group.selectionCount === 1 ? '' : 's'} para ${group.slug}`);
    }
    selected.forEach((skill) => unavailableSkills.add(skill));
    choiceCount += group.selectionCount;
  }
  return choiceCount;
}

function validateSelections(catalog: RulesetCatalog, selections: CharacterSelectionInput[], nex: number, classSlug: string): void {
  const selected = new Set<string>();
  for (const selection of selections) {
    if (selection.category !== 'power' && selection.category !== 'ritual') {
      throw new BadRequestException('A categoria da seleção deve ser poder ou ritual');
    }
    if (!selection.name?.trim()) throw new BadRequestException('Uma seleção deve ter o identificador de uma opção de regra');
    const option = (selection.category === 'power' ? catalog.powers : catalog.rituals).find((value) => value.slug === selection.name);
    if (!option || option.minNex > nex || (option.requiredClassSlug && option.requiredClassSlug !== classSlug)) throw new BadRequestException(`A seleção não está disponível: ${selection.name}`);
    const key = `${selection.category}:${selection.name}`;
    if (selected.has(key)) throw new BadRequestException(`Uma seleção só pode ser escolhida uma vez: ${selection.name}`);
    selected.add(key); const rank = selection.rank ?? 1;
    if (!Number.isInteger(rank) || rank < 1 || rank > option.maxRank) throw new BadRequestException('O grau da seleção não está disponível');
  }
}
