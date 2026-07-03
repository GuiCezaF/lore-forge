import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CampaignsService } from './campaigns.service';
import type { CampaignMemberRole } from '../database/schema';

interface CreateCampaignBody {
  name: string;
  description?: string | null;
}

interface UpdateCampaignBody {
  name?: string;
  description?: string | null;
  coverImageAssetId?: string | null;
}

interface AddMemberBody {
  shortCode: string;
  role: CampaignMemberRole;
}

@Controller('campaigns')
@ApiTags('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

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

  @Post(':campaignId/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adiciona membro à campanha' })
  @ApiOkResponse({ description: 'Membro adicionado' })
  addMember(
    @CurrentUser() user: AuthUser,
    @Param('campaignId') campaignId: string,
    @Body() body: AddMemberBody,
  ) {
    return this.campaignsService.addMember(user.id, campaignId, body);
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
    await this.campaignsService.removeMember(user.id, campaignId, memberUserId);
  }
}
