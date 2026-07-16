import { BadRequestException } from '@nestjs/common';

type CampaignResourceKey = 'currentHp' | 'currentSan' | 'currentEp';

interface CampaignStatePatch {
  currentHp?: number;
  currentSan?: number;
  currentEp?: number;
  conditions?: string;
  temporaryEffects?: string;
}

const campaignStateTextKeys = ['conditions', 'temporaryEffects'] as const;

export function parseCampaignStatePatch(
  body: unknown,
  applicableResources: CampaignResourceKey[],
  canEditEffects = true,
): CampaignStatePatch {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new BadRequestException('Play state must be an object');
  const record = body as Record<string, unknown>;
  const allowedKeys = new Set<string>([
    ...applicableResources,
    ...(canEditEffects ? campaignStateTextKeys : []),
  ]);
  const keys = Object.keys(record);
  if (!keys.length) throw new BadRequestException('Play state cannot be empty');
  for (const key of keys) {
    if (!allowedKeys.has(key))
      throw new BadRequestException(`Unknown or inapplicable field: ${key}`);
  }
  for (const key of applicableResources) {
    const value = record[key];
    if (value !== undefined && !Number.isInteger(value))
      throw new BadRequestException(`${key} must be an integer`);
  }
  for (const key of campaignStateTextKeys) {
    const value = record[key];
    if (value !== undefined && typeof value !== 'string')
      throw new BadRequestException(`${key} must be a string`);
  }
  return record;
}
