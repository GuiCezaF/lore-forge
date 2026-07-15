import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const CAMPAIGN_CLUE_STYLES = [
  'plain-document',
  'handwritten-letter',
  'typewritten-report',
  'newspaper-clipping',
  'confidential-dossier',
] as const;

export type CampaignClueStyle = (typeof CAMPAIGN_CLUE_STYLES)[number];

export class SaveCampaignClueDto {
  @ApiProperty({
    minLength: 1,
    maxLength: 120,
    example: 'Carta encontrada na biblioteca',
  })
  gmLabel!: string;

  @ApiProperty({
    nullable: true,
    maxLength: 200,
    example: 'Carta sem remetente',
  })
  title!: string | null;

  @ApiProperty({
    nullable: true,
    maxLength: 10000,
    example: 'Entregar somente após a cena 3.',
  })
  privateNotes!: string | null;

  @ApiProperty({ enum: CAMPAIGN_CLUE_STYLES, example: 'handwritten-letter' })
  style!: CampaignClueStyle;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: { type: 'doc', content: [] },
  })
  content!: Record<string, unknown>;
}

export class CampaignClueSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() campaignId!: string;
  @ApiProperty() kind!: 'text';
  @ApiProperty() gmLabel!: string;
  @ApiPropertyOptional({ nullable: true }) title!: string | null;
  @ApiProperty({ enum: CAMPAIGN_CLUE_STYLES }) style!: CampaignClueStyle;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class CampaignClueDetailDto extends CampaignClueSummaryDto {
  @ApiPropertyOptional({ nullable: true }) privateNotes!: string | null;
  @ApiProperty({ type: 'object', additionalProperties: true }) content!: Record<
    string,
    unknown
  >;
}
