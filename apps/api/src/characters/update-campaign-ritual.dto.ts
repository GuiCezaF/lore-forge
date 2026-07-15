import { ApiProperty } from '@nestjs/swagger';

export class UpdateCampaignRitualDto {
  @ApiProperty({ minimum: 1, type: 'integer' })
  rank!: number;
}
