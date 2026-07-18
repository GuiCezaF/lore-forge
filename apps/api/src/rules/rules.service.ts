import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import {
  ruleClassSkillChoices,
  ruleClassSkillGrants,
  ruleClasses,
  ruleOptions,
  ruleOriginSkillChoices,
  ruleOriginSkillGrants,
  ruleOrigins,
  rulePaths,
  ruleSkills,
  rulesets,
} from '../database/schema';

export interface SkillChoiceGroup {
  slug: string;
  selectionCount: number;
  skills: string[];
}

export interface RulesetCatalog {
  version: string;
  name: string;
  nex: { min: number; max: number; step: number };
  origins: Array<{
    slug: string;
    name: string;
    grantedSkills: string[];
    skillChoices: SkillChoiceGroup[];
  }>;
  classes: Array<{
    slug: string;
    name: string;
    baseHp: number;
    hpPerNex: number;
    baseSan: number;
    sanPerNex: number;
    baseEp: number;
    trainedSkills: number;
    trainingUpgradeBase: number;
    grantedSkills: string[];
    skillChoices: SkillChoiceGroup[];
    paths: Array<{ slug: string; name: string; minNex: number }>;
  }>;
  skills: Array<{ slug: string; name: string }>;
  powers: Array<{
    slug: string;
    name: string;
    minNex: number;
    maxRank: number;
    requiredClassSlug: string | null;
  }>;
  rituals: Array<{
    slug: string;
    name: string;
    minNex: number;
    maxRank: number;
    requiredClassSlug: string | null;
  }>;
}

@Injectable()
export class RulesService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async getCatalog(version: string): Promise<RulesetCatalog> {
    const [ruleset] = await this.db
      .select()
      .from(rulesets)
      .where(and(eq(rulesets.version, version), eq(rulesets.isActive, true)));
    if (!ruleset)
      throw new NotFoundException(
        `Conjunto de regras ${version} não encontrado`,
      );
    // Keep catalog reads deterministic for both database drivers and lightweight
    // adapters used by command/tests. The catalog is cached by the caller's
    // request lifecycle, and correctness of version scoping matters more than
    // parallelizing five tiny indexed queries.
    const classes = await this.db
      .select()
      .from(ruleClasses)
      .where(eq(ruleClasses.rulesetVersion, version));
    const paths = await this.db
      .select()
      .from(rulePaths)
      .where(sql`true`);
    const origins = await this.db
      .select()
      .from(ruleOrigins)
      .where(eq(ruleOrigins.rulesetVersion, version));
    const skills = await this.db
      .select()
      .from(ruleSkills)
      .where(eq(ruleSkills.rulesetVersion, version));
    const options = await this.db
      .select()
      .from(ruleOptions)
      .where(eq(ruleOptions.rulesetVersion, version));
    const classSkillGrants = await this.db
      .select()
      .from(ruleClassSkillGrants)
      .where(sql`true`);
    const classSkillChoices = await this.db
      .select()
      .from(ruleClassSkillChoices)
      .where(sql`true`);
    const originSkillGrants = await this.db
      .select()
      .from(ruleOriginSkillGrants)
      .where(sql`true`);
    const originSkillChoices = await this.db
      .select()
      .from(ruleOriginSkillChoices)
      .where(sql`true`);
    return {
      version: ruleset.version,
      name: ruleset.name,
      nex: { min: ruleset.minNex, max: ruleset.maxNex, step: ruleset.nexStep },
      origins: origins.map((origin) => ({
        slug: origin.slug,
        name: origin.name,
        grantedSkills: originSkillGrants
          .filter((grant) => grant.originId === origin.id)
          .map((grant) => grant.skillSlug),
        skillChoices: this.toSkillChoiceGroups(
          originSkillChoices.filter((choice) => choice.originId === origin.id),
        ),
      })),
      classes: classes.map((ruleClass) => ({
        slug: ruleClass.slug,
        name: ruleClass.name,
        baseHp: ruleClass.baseHp,
        hpPerNex: ruleClass.hpPerNex,
        baseSan: ruleClass.baseSan,
        sanPerNex: ruleClass.sanPerNex,
        baseEp: ruleClass.baseEp,
        trainedSkills: ruleClass.trainedSkills,
        trainingUpgradeBase: ruleClass.trainingUpgradeBase,
        grantedSkills: classSkillGrants
          .filter((grant) => grant.classId === ruleClass.id)
          .map((grant) => grant.skillSlug),
        skillChoices: this.toSkillChoiceGroups(
          classSkillChoices.filter((choice) => choice.classId === ruleClass.id),
        ),
        paths: paths
          .filter((path) => path.classId === ruleClass.id)
          .map(({ slug, name, minNex }) => ({ slug, name, minNex })),
      })),
      skills: skills.map(({ slug, name }) => ({ slug, name })),
      powers: options
        .filter((option) => option.kind === 'power')
        .map(({ slug, name, minNex, maxRank, requiredClassSlug }) => ({
          slug,
          name,
          minNex,
          maxRank,
          requiredClassSlug,
        })),
      rituals: options
        .filter((option) => option.kind === 'ritual')
        .map(({ slug, name, minNex, maxRank, requiredClassSlug }) => ({
          slug,
          name,
          minNex,
          maxRank,
          requiredClassSlug,
        })),
    };
  }

  private toSkillChoiceGroups(
    choices: Array<{
      groupSlug: string;
      skillSlug: string;
      selectionCount: number;
    }>,
  ): SkillChoiceGroup[] {
    const groups = new Map<string, SkillChoiceGroup>();
    for (const choice of choices) {
      const group = groups.get(choice.groupSlug) ?? {
        slug: choice.groupSlug,
        selectionCount: choice.selectionCount,
        skills: [],
      };
      group.skills.push(choice.skillSlug);
      groups.set(choice.groupSlug, group);
    }
    return [...groups.values()];
  }
}
