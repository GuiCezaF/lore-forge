import { Controller, Delete, Get, HttpCode, NotFoundException, Param, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SpectatorAccessService } from './spectator-access.service';

@ApiTags('spectator-access')
@Controller()
export class SpectatorAccessController {
  constructor(private readonly spectatorAccessService: SpectatorAccessService) {}

  @Get('campaigns/:campaignId/spectator-access')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ schema: { properties: { isActive: { type: 'boolean' } } } })
  getStatus(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string) { this.assertCampaignId(campaignId); return this.spectatorAccessService.getStatus(user.id, campaignId); }

  @Post('campaigns/:campaignId/spectator-access')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ schema: { properties: { token: { type: 'string' } } } })
  create(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string) { this.assertCampaignId(campaignId); return this.spectatorAccessService.create(user.id, campaignId); }

  @Post('campaigns/:campaignId/spectator-access/rotate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ schema: { properties: { token: { type: 'string' } } } })
  rotate(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string) { this.assertCampaignId(campaignId); return this.spectatorAccessService.rotate(user.id, campaignId); }

  @Delete('campaigns/:campaignId/spectator-access')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiNoContentResponse()
  async revoke(@CurrentUser() user: AuthUser, @Param('campaignId') campaignId: string): Promise<void> { this.assertCampaignId(campaignId); await this.spectatorAccessService.revoke(user.id, campaignId); }

  @Get('spectator-access/:token')
  @ApiOperation({ summary: 'Obtém os dados públicos limitados de uma campanha' })
  @ApiOkResponse({ schema: { properties: { name: { type: 'string' }, description: { type: 'string', nullable: true }, hasCoverImage: { type: 'boolean' } } } })
  @ApiNotFoundResponse()
  async getPublic(@Param('token') token: string, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    return this.spectatorAccessService.getPublicCampaign(token);
  }

  @Get('spectator-access/:token/cover')
  @ApiOperation({ summary: 'Obtém a capa pública por link de espectador' })
  @ApiNotFoundResponse()
  async getCover(@Param('token') token: string, @Res() res: Response): Promise<void> {
    const image = await this.spectatorAccessService.getPublicCover(token);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', image.mimeType);
    image.body.pipe(res);
  }

  private assertCampaignId(campaignId: string): void {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(campaignId)) {
      throw new NotFoundException('Campaign not found');
    }
  }
}
