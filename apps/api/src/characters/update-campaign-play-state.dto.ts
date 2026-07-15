import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCampaignPlayStateDto {
  @ApiPropertyOptional({ minimum: 0, type: 'integer' })
  currentHp?: number;

  @ApiPropertyOptional({ minimum: 0, type: 'integer' })
  currentSan?: number;

  @ApiPropertyOptional({ minimum: 0, type: 'integer' })
  currentEp?: number;

  @ApiPropertyOptional()
  conditions?: string;

  @ApiPropertyOptional()
  temporaryEffects?: string;
}
