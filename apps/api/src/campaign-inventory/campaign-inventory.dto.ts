import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CampaignInventoryEntryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() spacePerUnit!: number;
  @ApiProperty() totalSpace!: number;
  @ApiProperty() isEquipped!: boolean;
  @ApiPropertyOptional({ nullable: true }) visibleNotes!: string | null;
  @ApiPropertyOptional({ nullable: true }) gmNotes?: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class CampaignInventoryDto {
  @ApiProperty({ type: Object }) load!: {
    capacity: number;
    used: number;
    excess: number;
    isOverloaded: boolean;
  };
  @ApiProperty({ type: CampaignInventoryEntryDto, isArray: true })
  items!: CampaignInventoryEntryDto[];
}

export class CreateCampaignInventoryDto {
  @ApiPropertyOptional() sourceItemId?: string;
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() spacePerUnit?: number;
  @ApiProperty() quantity!: number;
  @ApiProperty() isEquipped!: boolean;
  @ApiPropertyOptional({ nullable: true }) visibleNotes?: string | null;
  @ApiPropertyOptional({ nullable: true }) gmNotes?: string | null;
}

export class UpdateCampaignInventoryDto {
  @ApiPropertyOptional() quantity?: number;
  @ApiPropertyOptional() spacePerUnit?: number;
  @ApiPropertyOptional() isEquipped?: boolean;
  @ApiPropertyOptional({ nullable: true }) visibleNotes?: string | null;
  @ApiPropertyOptional({ nullable: true }) gmNotes?: string | null;
}
