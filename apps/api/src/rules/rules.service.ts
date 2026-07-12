import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import { ruleClasses, ruleOptions, ruleOrigins, rulePaths, ruleSkills, rulesets } from '../database/schema';

export interface RulesetCatalog {
  version: string;
  name: string;
  nex: { min: number; max: number; step: number };
  origins: Array<{ slug: string; name: string }>;
  classes: Array<{ slug: string; name: string; baseHp: number; hpPerNex: number; baseSan: number; baseEp: number; trainedSkills: number; paths: Array<{ slug: string; name: string; minNex: number }> }>;
  skills: Array<{ slug: string; name: string }>;
  powers: Array<{ slug: string; name: string; minNex: number; maxRank: number; requiredClassSlug: string | null }>;
  rituals: Array<{ slug: string; name: string; minNex: number; maxRank: number; requiredClassSlug: string | null }>;
}

@Injectable()
export class RulesService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async getCatalog(version: string): Promise<RulesetCatalog> {
    const [ruleset] = await this.db.select().from(rulesets).where(and(eq(rulesets.version, version), eq(rulesets.isActive, true)));
    if (!ruleset) throw new NotFoundException(`Ruleset ${version} was not found`);
    // Keep catalog reads deterministic for both database drivers and lightweight
    // adapters used by command/tests. The catalog is cached by the caller's
    // request lifecycle, and correctness of version scoping matters more than
    // parallelizing five tiny indexed queries.
    const classes = await this.db.select().from(ruleClasses).where(eq(ruleClasses.rulesetVersion, version));
    const paths = await this.db.select().from(rulePaths).where(sql`true`);
    const origins = await this.db.select().from(ruleOrigins).where(eq(ruleOrigins.rulesetVersion, version));
    const skills = await this.db.select().from(ruleSkills).where(eq(ruleSkills.rulesetVersion, version));
    const options = await this.db.select().from(ruleOptions).where(eq(ruleOptions.rulesetVersion, version));
    return {
      version: ruleset.version, name: ruleset.name,
      nex: { min: ruleset.minNex, max: ruleset.maxNex, step: ruleset.nexStep },
      origins: origins.map(({ slug, name }) => ({ slug, name })),
      classes: classes.map((ruleClass) => ({
        slug: ruleClass.slug, name: ruleClass.name, baseHp: ruleClass.baseHp, hpPerNex: ruleClass.hpPerNex,
        baseSan: ruleClass.baseSan, baseEp: ruleClass.baseEp, trainedSkills: ruleClass.trainedSkills,
        paths: paths.filter((path) => path.classId === ruleClass.id).map(({ slug, name, minNex }) => ({ slug, name, minNex })),
      })),
      skills: skills.map(({ slug, name }) => ({ slug, name })),
      powers: options.filter((option) => option.kind === 'power').map(({ slug, name, minNex, maxRank, requiredClassSlug }) => ({ slug, name, minNex, maxRank, requiredClassSlug })),
      rituals: options.filter((option) => option.kind === 'ritual').map(({ slug, name, minNex, maxRank, requiredClassSlug }) => ({ slug, name, minNex, maxRank, requiredClassSlug })),
    };
  }
}
