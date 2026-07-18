import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CampaignInventoryService } from './campaign-inventory.service';
import {
  CampaignInventoryDto,
  CampaignInventoryEntryDto,
  CreateCampaignInventoryDto,
  UpdateCampaignInventoryDto,
} from './campaign-inventory.dto';

@Controller('characters/:characterId/inventory')
@ApiTags('campaign-inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CampaignInventoryController {
  constructor(private readonly service: CampaignInventoryService) {}
  @Get()
  @ApiOperation({ summary: 'Lists campaign inventory and authoritative load' })
  @ApiOkResponse({ type: CampaignInventoryDto })
  @Header('Cache-Control', 'private, no-store')
  list(
    @CurrentUser() user: AuthUser,
    @Param('characterId') characterId: string,
  ) {
    return this.service.list(user.id, characterId);
  }
  @Post()
  @ApiOperation({ summary: 'Adds a campaign inventory snapshot' })
  @ApiCreatedResponse({ type: CampaignInventoryEntryDto })
  @Header('Cache-Control', 'private, no-store')
  create(
    @CurrentUser() user: AuthUser,
    @Param('characterId') characterId: string,
    @Body() body: CreateCampaignInventoryDto,
  ) {
    return this.service.create(user.id, characterId, body);
  }
  @Patch(':inventoryId')
  @ApiOkResponse({ type: CampaignInventoryEntryDto })
  @Header('Cache-Control', 'private, no-store')
  update(
    @CurrentUser() user: AuthUser,
    @Param('characterId') characterId: string,
    @Param('inventoryId') inventoryId: string,
    @Body() body: UpdateCampaignInventoryDto,
  ) {
    return this.service.update(user.id, characterId, inventoryId, body);
  }
  @Delete(':inventoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @Header('Cache-Control', 'private, no-store')
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('characterId') characterId: string,
    @Param('inventoryId') inventoryId: string,
  ): Promise<void> {
    await this.service.remove(user.id, characterId, inventoryId);
  }
}
