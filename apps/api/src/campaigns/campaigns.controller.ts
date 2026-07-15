import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CampaignsService } from './campaigns.service';

interface CreateCampaignBody {
  name: string;
  description?: string | null;
}

interface UpdateCampaignBody {
  name?: string;
  description?: string | null;
  coverImageAssetId?: string | null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHORT_CODE_PATTERN = /^lf-[a-z0-9]{6}$/i;

@Controller('campaigns')
@ApiTags('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  // Static invitation routes must be registered before `:campaignId`, or an
  // Express router can interpret "invitations" as a campaign id.
  @Get('invitations/mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listInvitations(@CurrentUser() user: AuthUser) {
    return this.campaignsService.listMyInvitations(user.id);
  }

  @Post('invitations/:invitationId/respond')
  @HttpCode(204)
  @ApiBody({ schema: { type: 'object', required: ['accepted'], properties: { accepted: { type: 'boolean' } }, additionalProperties: false } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async respond(
    @CurrentUser() user: AuthUser,
    @Param('invitationId') invitationId: string,
    @Body() body: unknown,
  ): Promise<void> {
    this.validateUuid(invitationId);
    if (!this.isRecord(body) || typeof body.accepted !== 'boolean' || Object.keys(body).length !== 1) throw new BadRequestException('accepted must be a boolean');
    await this.campaignsService.respondToInvitation(user.id, invitationId, body.accepted);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista campanhas do usuário' })
  @ApiOkResponse({ description: 'Campanhas' })
  list(@CurrentUser() user: AuthUser) {
    return this.campaignsService.listMyCampaigns(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria uma campanha' })
  @ApiOkResponse({ description: 'Campanha criada' })
  create(@CurrentUser() user: AuthUser, @Body() body: CreateCampaignBody) {
    return this.campaignsService.createCampaign(user.id, body);
  }

  @Get(':campaignId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalha uma campanha' })
  @ApiOkResponse({ description: 'Campanha' })
  get(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string) {
    return this.campaignsService.getCampaign(user.id, campaignId);
  }

  @Patch(':campaignId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza uma campanha' })
  @ApiOkResponse({ description: 'Campanha atualizada' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('campaignId') campaignId: string,
    @Body() body: UpdateCampaignBody,
  ) {
    return this.campaignsService.updateCampaign(user.id, campaignId, body);
  }

  @Delete(':campaignId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove uma campanha' })
  @ApiNoContentResponse({ description: 'Campanha removida' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('campaignId') campaignId: string,
  ): Promise<void> {
    await this.campaignsService.deleteCampaign(user.id, campaignId);
  }

  @Delete(':campaignId/members/:memberUserId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove membro da campanha' })
  @ApiNoContentResponse({ description: 'Membro removido' })
  async removeMember(
    @CurrentUser() user: AuthUser,
    @Param('campaignId') campaignId: string,
    @Param('memberUserId') memberUserId: string,
  ): Promise<void> {
    this.validateUuid(campaignId);
    this.validateUuid(memberUserId);
    await this.campaignsService.removeMember(user.id, campaignId, memberUserId);
  }

  @Post(':campaignId/invitations')
  @ApiBody({ schema: { type: 'object', required: ['shortCode'], properties: { shortCode: { type: 'string', pattern: '^lf-[a-z0-9]{6}$' } }, additionalProperties: false } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  invite(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string, @Body() body: unknown) {
    this.validateUuid(campaignId);
    if (!this.isRecord(body) || typeof body.shortCode !== 'string' || !SHORT_CODE_PATTERN.test(body.shortCode) || Object.keys(body).length !== 1) throw new BadRequestException('shortCode must use the lf-xxxxxx format');
    return this.campaignsService.invitePlayer(user.id, campaignId, body.shortCode);
  }

  @Get(':campaignId/invitations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listCampaignInvitations(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string) {
    return this.campaignsService.listCampaignInvitations(user.id, campaignId);
  }

  @Delete(':campaignId/invitations/:invitationId')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async cancelInvitation(
    @CurrentUser() user: AuthUser,
    @Param('campaignId') campaignId: string,
    @Param('invitationId') invitationId: string,
  ): Promise<void> {
    this.validateUuid(campaignId);
    this.validateUuid(invitationId);
    await this.campaignsService.cancelInvitation(user.id, campaignId, invitationId);
  }

  @Delete(':campaignId/membership')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async leave(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string): Promise<void> {
    this.validateUuid(campaignId);
    await this.campaignsService.leaveCampaign(user.id, campaignId);
  }

  private validateUuid(value: string): void {
    if (!UUID_PATTERN.test(value)) throw new BadRequestException('Invalid UUID');
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
