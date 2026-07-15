import { BadRequestException } from '@nestjs/common';
import { normalizeCampaignStatePatch } from './normalize-campaign-state-patch';
import { parseCampaignStatePatch } from './parse-campaign-state-patch';

describe('campaign play-state patches', () => {
  it('clamps resource values to their applicable maximums', () => {
    const patch = parseCampaignStatePatch(
      { currentHp: 99, currentSan: -4, currentEp: 3 },
      ['currentHp', 'currentSan', 'currentEp'],
    );

    expect(
      normalizeCampaignStatePatch(patch, {
        currentHp: 20,
        currentSan: 10,
        currentEp: 5,
      }),
    ).toEqual({ currentHp: 20, currentSan: 0, currentEp: 3 });
  });

  it('rejects non-integer, unknown, and inapplicable state fields', () => {
    expect(() =>
      parseCampaignStatePatch({ currentHp: 1.5 }, [
        'currentHp',
        'currentSan',
        'currentEp',
      ]),
    ).toThrow(BadRequestException);
    expect(() =>
      parseCampaignStatePatch({ gmNotes: 'private' }, ['currentHp']),
    ).toThrow(BadRequestException);
    expect(() =>
      parseCampaignStatePatch({ currentSan: 1 }, ['currentHp']),
    ).toThrow(BadRequestException);
  });
});
