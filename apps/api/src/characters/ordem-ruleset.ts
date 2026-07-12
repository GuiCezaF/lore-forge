import { BadRequestException } from '@nestjs/common';
import type { RulesetCatalog } from '../rules/rules.service';

export type SkillDegree = 'trained' | 'veteran' | 'expert';
export interface CharacterAttributes { agility: number; strength: number; intellect: number; presence: number; vigor: number; }
export interface CharacterSelectionInput { category: 'power' | 'ritual'; name: string; rank?: number; }
export interface CharacterSkillInput { name: string; degree?: SkillDegree; }
export interface CharacterDerived { maxHp: number; maxSan: number; maxEp: number; epLimit: number; defense: number; dodge: number; block: number; movement: number; carryCapacity: number; }

const MIN_ATTRIBUTE = 0;
const MAX_ATTRIBUTE = 5;

export function calculateDerived(catalog: RulesetCatalog, classSlug: string, nex: number, attributes: CharacterAttributes): CharacterDerived {
  validateNex(catalog, nex);
  validateAttributes(attributes);
  const characterClass = catalog.classes.find((value) => value.slug === classSlug);
  if (!characterClass) throw new BadRequestException('Choose a valid class');
  const advances = Math.floor((nex - catalog.nex.min) / catalog.nex.step);
  return {
    maxHp: characterClass.baseHp + attributes.vigor + advances * (characterClass.hpPerNex + attributes.vigor),
    maxSan: characterClass.baseSan + attributes.presence + advances * attributes.presence,
    maxEp: characterClass.baseEp + attributes.presence + advances * (characterClass.baseEp + attributes.presence),
    epLimit: Math.floor(nex / catalog.nex.step), defense: 10 + attributes.agility,
    dodge: attributes.agility, block: attributes.strength, movement: 9,
    carryCapacity: 5 + attributes.strength * 5,
  };
}

export function validateBuild(catalog: RulesetCatalog, input: { origin?: string | null; characterClass?: string | null; path?: string | null; nex: number; attributes: CharacterAttributes; skills?: CharacterSkillInput[]; selections?: CharacterSelectionInput[]; isFinal?: boolean }): void {
  // A draft is intentionally allowed to be incomplete (or temporarily
  // inconsistent after changing class/NEX).  The finalization endpoint runs
  // the complete validation below.  This is what lets server-side auto-save
  // preserve the user's entered values instead of rejecting and losing them.
  if (!input.isFinal) return;
  validateNex(catalog, input.nex);
  validateAttributes(input.attributes);
  if (!input.origin || !catalog.origins.some((origin) => origin.slug === input.origin)) throw new BadRequestException('Choose a valid origin');
  const characterClass = catalog.classes.find((value) => value.slug === input.characterClass);
  if (!characterClass) throw new BadRequestException('Choose a valid class');
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
    throw new BadRequestException('Choose a valid path for the selected class and NEX');
  }
  validateSkills(catalog, input.skills ?? [], input.nex, characterClass.trainedSkills + input.attributes.intellect);
  validateSelections(catalog, input.selections ?? [], input.nex, characterClass.slug);
}

function validateNex(catalog: RulesetCatalog, nex: number): void {
  if (!Number.isInteger(nex) || nex < catalog.nex.min || nex > catalog.nex.max || nex % catalog.nex.step !== 0) throw new BadRequestException(`NEX must be a multiple of ${catalog.nex.step} between ${catalog.nex.min} and ${catalog.nex.max}`);
}

function validateAttributes(attributes: CharacterAttributes): void {
  for (const value of Object.values(attributes)) if (!Number.isInteger(value) || value < MIN_ATTRIBUTE || value > MAX_ATTRIBUTE) throw new BadRequestException('Attributes must be whole numbers between 0 and 5');
}

function validateSkills(catalog: RulesetCatalog, skills: CharacterSkillInput[], nex: number, allowedTrained: number): void {
  const names = new Set<string>(); let trained = 0;
  for (const skill of skills) {
    if (!catalog.skills.some((value) => value.slug === skill.name)) throw new BadRequestException(`Unknown skill: ${skill.name}`);
    if (names.has(skill.name)) throw new BadRequestException(`A skill can only be selected once: ${skill.name}`);
    names.add(skill.name); const degree = skill.degree ?? 'trained';
    if (!['trained', 'veteran', 'expert'].includes(degree)) throw new BadRequestException('Invalid skill degree');
    if (degree === 'veteran' && nex < 35) throw new BadRequestException('Veteran skills require NEX 35');
    if (degree === 'expert' && nex < 70) throw new BadRequestException('Expert skills require NEX 70');
    if (degree === 'trained') trained += 1;
  }
  if (trained > allowedTrained) throw new BadRequestException(`This build can train at most ${allowedTrained} skills`);
}

function validateSelections(catalog: RulesetCatalog, selections: CharacterSelectionInput[], nex: number, classSlug: string): void {
  const selected = new Set<string>();
  for (const selection of selections) {
    if (selection.category !== 'power' && selection.category !== 'ritual') {
      throw new BadRequestException('Selection category must be power or ritual');
    }
    if (!selection.name?.trim()) throw new BadRequestException('A selection must have a rule option slug');
    const option = (selection.category === 'power' ? catalog.powers : catalog.rituals).find((value) => value.slug === selection.name);
    if (!option || option.minNex > nex || (option.requiredClassSlug && option.requiredClassSlug !== classSlug)) throw new BadRequestException(`Selection is not available: ${selection.name}`);
    const key = `${selection.category}:${selection.name}`;
    if (selected.has(key)) throw new BadRequestException(`Selection can only be chosen once: ${selection.name}`);
    selected.add(key); const rank = selection.rank ?? 1;
    if (!Number.isInteger(rank) || rank < 1 || rank > option.maxRank) throw new BadRequestException('Selection rank is not available');
  }
}
