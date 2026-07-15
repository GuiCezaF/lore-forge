import { ApiProperty } from '@nestjs/swagger';

export class CampaignRitualDto {
  @ApiProperty()
  slug!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty({ minimum: 1, type: 'integer' })
  rank!: number;
  @ApiProperty({ minimum: 1, type: 'integer' })
  maxRank!: number;
}
