type CampaignResourceKey = 'currentHp' | 'currentSan' | 'currentEp';
type CampaignResourceMaximums = Record<CampaignResourceKey, number>;
interface CampaignStatePatch {
  currentHp?: number;
  currentSan?: number;
  currentEp?: number;
  conditions?: string;
  temporaryEffects?: string;
}

const campaignResourceKeys: CampaignResourceKey[] = [
  'currentHp',
  'currentSan',
  'currentEp',
];

export function normalizeCampaignStatePatch(
  patch: CampaignStatePatch,
  maximums: CampaignResourceMaximums,
): CampaignStatePatch {
  const normalized: CampaignStatePatch = {
    ...(patch.conditions !== undefined ? { conditions: patch.conditions } : {}),
    ...(patch.temporaryEffects !== undefined
      ? { temporaryEffects: patch.temporaryEffects }
      : {}),
  };
  for (const key of campaignResourceKeys) {
    const value = patch[key];
    if (value !== undefined)
      normalized[key] = Math.min(Math.max(value, 0), maximums[key]);
  }
  return normalized;
}
