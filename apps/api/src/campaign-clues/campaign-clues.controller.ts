import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CampaignClueDetailDto,
  CampaignClueSummaryDto,
  SaveCampaignClueDto,
} from './campaign-clues.dto';
import { CampaignCluesService } from './campaign-clues.service';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Controller('campaigns/:campaignId/clues')
@ApiTags('campaign-clues')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Authentication required' })
@ApiBadRequestResponse({ description: 'Invalid identifier or clue payload' })
@ApiForbiddenResponse({ description: 'Only the campaign GM can manage clues' })
@ApiNotFoundResponse({ description: 'Campaign or clue not found' })
export class CampaignCluesController {
  constructor(private readonly campaignCluesService: CampaignCluesService) {}

  @Get()
  @ApiOperation({ summary: 'Lists campaign clue summaries for the GM' })
  @ApiOkResponse({ type: CampaignClueSummaryDto, isArray: true })
  list(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string) {
    this.validateUuid(campaignId);
    return this.campaignCluesService.list(user.id, campaignId);
  }

  @Post()
  @ApiOperation({ summary: 'Creates a text campaign clue' })
  @ApiCreatedResponse({ type: CampaignClueDetailDto })
  create(
    @CurrentUser() user: AuthUser,
    @Param('campaignId') campaignId: string,
    @Body() body: SaveCampaignClueDto,
  ) {
    this.validateUuid(campaignId);
    return this.campaignCluesService.create(user.id, campaignId, body);
  }

  @Get(':clueId')
  @ApiOperation({ summary: 'Gets a campaign clue with private GM fields' })
  @ApiOkResponse({ type: CampaignClueDetailDto })
  get(
    @CurrentUser() user: AuthUser,
    @Param('campaignId') campaignId: string,
    @Param('clueId') clueId: string,
  ) {
    this.validateUuid(campaignId);
    this.validateUuid(clueId);
    return this.campaignCluesService.get(user.id, campaignId, clueId);
  }

  @Put(':clueId')
  @ApiOperation({ summary: 'Atomically replaces a campaign clue' })
  @ApiOkResponse({ type: CampaignClueDetailDto })
  update(
    @CurrentUser() user: AuthUser,
    @Param('campaignId') campaignId: string,
    @Param('clueId') clueId: string,
    @Body() body: SaveCampaignClueDto,
  ) {
    this.validateUuid(campaignId);
    this.validateUuid(clueId);
    return this.campaignCluesService.update(user.id, campaignId, clueId, body);
  }

  private validateUuid(value: string): void {
    if (!UUID_PATTERN.test(value))
      throw new BadRequestException('Invalid UUID');
  }
}
