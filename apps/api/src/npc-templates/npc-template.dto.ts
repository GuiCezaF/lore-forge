import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { NpcStatBlockInput } from '../characters/characters.service';

export class NpcTemplateWriteDto {
  @ApiProperty({ example: 'O informante' }) name!: string;
  @ApiPropertyOptional() concept?: string | null;
  @ApiPropertyOptional() appearance?: string | null;
  @ApiPropertyOptional() personality?: string | null;
  @ApiPropertyOptional() history?: string | null;
  @ApiPropertyOptional() objective?: string | null;
  @ApiPropertyOptional({ description: 'Notas privadas do proprietário' })
  playerNotes?: string | null;
  @ApiProperty({ enum: ['narrative', 'threat'] }) npcMode!:
    'narrative' | 'threat';
  @ApiPropertyOptional() imageAssetId?: string | null;
  @ApiPropertyOptional() agility?: number;
  @ApiPropertyOptional() strength?: number;
  @ApiPropertyOptional() intellect?: number;
  @ApiPropertyOptional() presence?: number;
  @ApiPropertyOptional() vigor?: number;
  @ApiPropertyOptional({ type: Object }) npcStatBlock?: NpcStatBlockInput;
}

export class NpcTemplateDraftDto {
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() concept?: string | null;
  @ApiPropertyOptional() appearance?: string | null;
  @ApiPropertyOptional() personality?: string | null;
  @ApiPropertyOptional() history?: string | null;
  @ApiPropertyOptional() objective?: string | null;
  @ApiPropertyOptional() playerNotes?: string | null;
  @ApiPropertyOptional({ enum: ['narrative', 'threat'] }) npcMode?:
    'narrative' | 'threat';
  @ApiPropertyOptional() imageAssetId?: string | null;
  @ApiPropertyOptional({ type: Object }) npcStatBlock?: NpcStatBlockInput;
}

export class NpcTemplateSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: ['draft', 'active'] }) status!: 'draft' | 'active';
  @ApiProperty({ enum: ['narrative', 'threat'] }) npcMode!:
    'narrative' | 'threat';
  @ApiPropertyOptional() concept!: string | null;
  @ApiPropertyOptional() imageAssetId!: string | null;
  @ApiProperty() updatedAt!: string;
}
