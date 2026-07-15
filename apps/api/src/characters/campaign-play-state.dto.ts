import { ApiProperty } from '@nestjs/swagger';
import { CampaignRitualDto } from './campaign-ritual.dto';

export class CampaignPlayStateDto {
  @ApiProperty({ nullable: true })
  currentHp!: number | null;
  @ApiProperty({ nullable: true })
  maxHp!: number | null;
  @ApiProperty({ nullable: true })
  currentSan!: number | null;
  @ApiProperty({ nullable: true })
  maxSan!: number | null;
  @ApiProperty({ nullable: true })
  currentEp!: number | null;
  @ApiProperty({ nullable: true })
  maxEp!: number | null;
  @ApiProperty()
  conditions!: string;
  @ApiProperty()
  temporaryEffects!: string;
  @ApiProperty({ nullable: true })
  gmNotes!: string | null;
  @ApiProperty()
  updatedAt!: string;
  @ApiProperty({ type: CampaignRitualDto, isArray: true })
  rituals!: CampaignRitualDto[];
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  inventory!: Array<Record<string, unknown>>;
}
