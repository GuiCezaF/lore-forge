import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { EntityScope, ItemKind } from '../database/schema';

export class CreateItemDto {
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) description?: string | null;
  @ApiPropertyOptional({ type: Object }) data?: Record<string, unknown>;
  @ApiPropertyOptional({ nullable: true }) imageAssetId?: string | null;
  @ApiPropertyOptional({ enum: ['user', 'campaign'] }) scope?: EntityScope;
  @ApiPropertyOptional({ enum: ['item', 'document'] }) kind?: ItemKind;
  @ApiPropertyOptional({ nullable: true }) campaignId?: string | null;
  @ApiPropertyOptional() space?: number;
}

export class UpdateItemDto {
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional({ nullable: true }) description?: string | null;
  @ApiPropertyOptional({ type: Object }) data?: Record<string, unknown>;
  @ApiPropertyOptional({ nullable: true }) imageAssetId?: string | null;
  @ApiPropertyOptional() space?: number;
}

export class CloneItemDto {
  @ApiPropertyOptional({ enum: ['user', 'campaign'] }) scope?:
    | 'user'
    | 'campaign';
  @ApiPropertyOptional({ nullable: true }) campaignId?: string | null;
  @ApiPropertyOptional() name?: string;
}
