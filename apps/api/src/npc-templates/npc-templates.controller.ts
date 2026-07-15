import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  NpcTemplateDraftDto,
  NpcTemplateSummaryDto,
  NpcTemplateWriteDto,
} from './npc-template.dto';
import { NpcTemplatesService } from './npc-templates.service';
@Controller('npc-templates')
@ApiTags('npc-templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NpcTemplatesController {
  constructor(private readonly service: NpcTemplatesService) {}
  @Get()
  @ApiOperation({ summary: 'Lista os modelos de NPC privados do usuário' })
  @ApiOkResponse({ type: NpcTemplateSummaryDto, isArray: true })
  list(@CurrentUser() user: AuthUser) {
    return this.service.list(user.id);
  }
  @Post() @ApiOperation({ summary: 'Cria um modelo de NPC ativo' }) create(
    @CurrentUser() user: AuthUser,
    @Body() body: NpcTemplateWriteDto,
  ) {
    return this.service.create(user.id, body);
  }
  @Post('drafts')
  @ApiOperation({ summary: 'Cria um rascunho recuperável de modelo de NPC' })
  createDraft(
    @CurrentUser() user: AuthUser,
    @Body() body: NpcTemplateDraftDto,
  ) {
    return this.service.createDraft(user.id, body);
  }
  @Get(':templateId')
  @ApiOperation({ summary: 'Detalha um modelo de NPC privado' })
  get(@CurrentUser() user: AuthUser, @Param('templateId') id: string) {
    return this.service.get(user.id, id);
  }
  @Put(':templateId')
  @ApiOperation({ summary: 'Atualiza um modelo de NPC ativo' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('templateId') id: string,
    @Body() body: NpcTemplateWriteDto,
  ) {
    return this.service.update(user.id, id, body);
  }
  @Put(':templateId/draft')
  @ApiOperation({ summary: 'Autosalva um rascunho de modelo de NPC' })
  saveDraft(
    @CurrentUser() user: AuthUser,
    @Param('templateId') id: string,
    @Body() body: NpcTemplateDraftDto,
  ) {
    return this.service.saveDraft(user.id, id, body);
  }
  @Post(':templateId/publish')
  @ApiOperation({ summary: 'Publica um rascunho de modelo de NPC' })
  publish(@CurrentUser() user: AuthUser, @Param('templateId') id: string) {
    return this.service.publish(user.id, id);
  }
  @Delete(':templateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclui logicamente um modelo de NPC' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('templateId') id: string,
  ): Promise<void> {
    await this.service.remove(user.id, id);
  }
}
