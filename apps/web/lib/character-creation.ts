export type CharacterPath = {
  slug: string;
  name: string;
  minNex: number;
};

export type NexRules = {
  min: number;
  max: number;
  step: number;
};

export type CharacterAttributes = {
  agility: number;
  strength: number;
  intellect: number;
  presence: number;
  vigor: number;
};

export type SkillDegree = "trained" | "veteran" | "expert";

export type CharacterSkill = {
  name: string;
  degree: SkillDegree;
};

export type SkillChoiceGroup = {
  slug: string;
  selectionCount: number;
  skills: string[];
};

export type CharacterOrigin = {
  slug: string;
  name: string;
  grantedSkills: string[];
  skillChoices: SkillChoiceGroup[];
};

export type CharacterClass = {
  slug: string;
  name: string;
  paths: CharacterPath[];
  trainedSkills: number;
  trainingUpgradeBase: number;
  grantedSkills: string[];
  skillChoices: SkillChoiceGroup[];
};

export type RulesetSkill = {
  slug: string;
  name: string;
};

export type CharacterPower = {
  slug: string;
  name: string;
  minNex: number;
  maxRank: number;
  requiredClassSlug: string | null;
};

const ATTRIBUTE_BUDGET_BASE = 9;
const ATTRIBUTE_NEX_THRESHOLDS = [20, 50, 80, 95] as const;
const ATTRIBUTE_CAP_BELOW_20_NEX = 3;
const ATTRIBUTE_CAP_AT_20_NEX = 4;
const ATTRIBUTE_CAP_AT_50_NEX = 5;

export function getAttributeBudget(nex: number): number {
  return ATTRIBUTE_BUDGET_BASE + ATTRIBUTE_NEX_THRESHOLDS.filter((threshold) => nex >= threshold).length;
}

export function getAttributeCap(nex: number): number {
  if (nex >= 50) return ATTRIBUTE_CAP_AT_50_NEX;
  if (nex >= 20) return ATTRIBUTE_CAP_AT_20_NEX;
  return ATTRIBUTE_CAP_BELOW_20_NEX;
}

export function getAttributeSpent(attributes: CharacterAttributes): number {
  return Object.values(attributes).reduce((total, value) => total + value, 0);
}

export function normalizeAttributes(attributes: CharacterAttributes, nex: number): CharacterAttributes {
  const cap = getAttributeCap(nex);
  const budget = getAttributeBudget(nex);
  const normalized = { ...attributes };
  const keys = Object.keys(normalized) as Array<keyof CharacterAttributes>;

  for (const key of keys) {
    normalized[key] = Math.min(cap, Math.max(0, normalized[key]));
  }

  let excess = getAttributeSpent(normalized) - budget;
  for (const key of [...keys].reverse()) {
    if (excess <= 0) break;
    const reducible = Math.min(normalized[key], excess);
    normalized[key] -= reducible;
    excess -= reducible;
  }

  return normalized;
}

export function getNexOptions(rules: NexRules | undefined): number[] {
  if (!rules || rules.step <= 0 || rules.min > rules.max) return [];

  const options: number[] = [];
  for (let nex = rules.min; nex <= rules.max; nex += rules.step) {
    options.push(nex);
  }

  if (options.at(-1) !== rules.max) options.push(rules.max);
  return options;
}

export function getAvailablePaths(paths: CharacterPath[], nex: number): CharacterPath[] {
  return paths.filter((path) => nex >= path.minNex);
}

export function getGrantedSkillNames(origin: CharacterOrigin | undefined, characterClass: CharacterClass | undefined): string[] {
  return [...new Set([...(origin?.grantedSkills ?? []), ...(characterClass?.grantedSkills ?? [])])];
}

export function getSkillChoiceCount(origin: CharacterOrigin | undefined, characterClass: CharacterClass | undefined): number {
  return [...(origin?.skillChoices ?? []), ...(characterClass?.skillChoices ?? [])]
    .reduce((total, group) => total + group.selectionCount, 0);
}

export function getRequiredSkillCount(
  origin: CharacterOrigin | undefined,
  characterClass: CharacterClass | undefined,
  intellect: number,
): number {
  if (!characterClass) return 0;

  return getGrantedSkillNames(origin, characterClass).length
    + getSkillChoiceCount(origin, characterClass)
    + characterClass.trainedSkills
    + Math.max(0, intellect);
}

export function getTrainingUpgradeLimit(characterClass: CharacterClass | undefined, intellect: number): number {
  if (!characterClass) return 0;

  return characterClass.trainingUpgradeBase + Math.max(0, intellect);
}

export function getTrainingUpgradeCount(skills: CharacterSkill[]): number {
  return skills.reduce((total, skill) => total + (skill.degree === "expert" ? 2 : skill.degree === "veteran" ? 1 : 0), 0);
}

export function getAvailablePowers(powers: CharacterPower[], nex: number, classSlug: string): CharacterPower[] {
  return powers.filter((power) => power.minNex <= nex && (!power.requiredClassSlug || power.requiredClassSlug === classSlug));
}

export function getPowerSelectionLimit(nex: number): number {
  return Math.max(0, Math.floor(nex / 15));
}
