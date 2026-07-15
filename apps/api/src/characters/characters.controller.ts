import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
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
import { CampaignPlayStateDto } from './campaign-play-state.dto';
import { CampaignRitualDto } from './campaign-ritual.dto';
import { UpdateCampaignPlayStateDto } from './update-campaign-play-state.dto';
import { UpdateCampaignRitualDto } from './update-campaign-ritual.dto';
import { CharactersService } from './characters.service';

@Controller('characters')
@ApiTags('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista fichas acessíveis ao usuário' })
  @ApiOkResponse({ description: 'Fichas' })
  list(@CurrentUser() user: AuthUser) {
    return this.charactersService.listMyCharacters(user.id);
  }

  @Get('npcs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lista NPCs das campanhas administradas pelo Mestre',
  })
  @ApiOkResponse({ description: 'NPCs gerenciáveis' })
  listNpcs(@CurrentUser() user: AuthUser) {
    return this.charactersService.listNpcsForGm(user.id);
  }

  @Get('ruleset')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Returns the database-backed character rules catalog',
  })
  ruleset() {
    return this.charactersService.getRuleset();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria uma ficha' })
  @ApiOkResponse({ description: 'Ficha criada' })
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    if (body.kind === 'npc') {
      throw new BadRequestException(
        'NPCs must be added from a published template in a campaign',
      );
    }
    return this.charactersService.createPlayerCharacter(user.id, body);
  }

  @Post('drafts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria um rascunho persistido de ficha de jogador' })
  createDraft(@CurrentUser() user: AuthUser, @Body() body: any) {
    if (body.kind === 'npc')
      throw new BadRequestException(
        'NPCs must be added from a published template in a campaign',
      );
    return this.charactersService.createDraft(user.id, body);
  }

  @Patch(':characterId/draft')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Salva automaticamente um rascunho de ficha' })
  saveDraft(
    @CurrentUser() user: AuthUser,
    @Param('characterId') characterId: string,
    @Body() body: any,
  ) {
    return this.charactersService.saveDraft(user.id, characterId, body);
  }

  @Post(':characterId/copy')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Copia apenas a ficha permanente de um personagem' })
  copy(
    @CurrentUser() user: AuthUser,
    @Param('characterId') characterId: string,
    @Body() body: { sheetLabel?: string },
  ) {
    return this.charactersService.copyCharacter(
      user.id,
      characterId,
      body?.sheetLabel,
    );
  }

  @Post(':characterId/edit-draft')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria ou retoma uma revisão da ficha ativa' })
  beginEditDraft(
    @CurrentUser() user: AuthUser,
    @Param('characterId') characterId: string,
  ) {
    return this.charactersService.beginEditDraft(user.id, characterId);
  }

  @Put(':characterId/edit-draft')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Autosalva o snapshot completo de uma revisão' })
  saveEditDraft(
    @CurrentUser() user: AuthUser,
    @Param('characterId') characterId: string,
    @Body() body: any,
  ) {
    return this.charactersService.saveEditDraft(user.id, characterId, body);
  }

  @Post(':characterId/edit-draft/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publica uma revisão sem conflitos' })
  publishEditDraft(
    @CurrentUser() user: AuthUser,
    @Param('characterId') characterId: string,
  ) {
    return this.charactersService.publishEditDraft(user.id, characterId);
  }

  @Delete(':characterId/edit-draft')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Descarta idempotentemente uma revisão' })
  async discardEditDraft(
    @CurrentUser() user: AuthUser,
    @Param('characterId') characterId: string,
  ): Promise<void> {
    await this.charactersService.discardEditDraft(user.id, characterId);
  }

  @Post(':characterId/archive')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Arquiva uma ficha vinculada à campanha' })
  async archive(
    @CurrentUser() user: AuthUser,
    @Param('characterId') characterId: string,
  ): Promise<void> {
    await this.charactersService.archiveCharacter(user.id, characterId);
  }

  @Get(':characterId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalha uma ficha' })
  @ApiOkResponse({ description: 'Ficha' })
  get(
    @CurrentUser() user: AuthUser,
    @Param('characterId') characterId: string,
  ) {
    return this.charactersService.getCharacter(user.id, characterId);
  }

  @Patch(':characterId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza uma ficha' })
  @ApiOkResponse({ description: 'Ficha atualizada' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('characterId') characterId: string,
    @Body() body: any,
  ) {
    return this.charactersService.updateCharacter(user.id, characterId, body);
  }

  @Get(':characterId/play-state')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtém estado e inventário exclusivos da campanha' })
  @ApiOkResponse({ type: CampaignPlayStateDto })
  playState(
    @CurrentUser() user: AuthUser,
    @Param('characterId') characterId: string,
  ) {
    return this.charactersService.getCampaignPlayState(user.id, characterId);
  }

  @Get(':characterId/npc-stat-block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtém o bloco de ameaça tipado de um NPC' })
  npcStatBlock(
    @CurrentUser() user: AuthUser,
    @Param('characterId') characterId: string,
  ) {
    return this.charactersService.getNpcStatBlock(user.id, characterId);
  }

  @Patch(':characterId/play-state')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualiza recursos e efeitos do estado jogável na campanha',
  })
  @ApiBody({ type: UpdateCampaignPlayStateDto })
  @ApiOkResponse({ type: CampaignPlayStateDto })
  updatePlayState(
    @CurrentUser() user: AuthUser,
    @Param('characterId') characterId: string,
    @Body() body: UpdateCampaignPlayStateDto,
  ) {
    return this.charactersService.updateCampaignState(
      user.id,
      characterId,
      body,
    );
  }

  @Put(':characterId/rituals/:ritualSlug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inclui ou atualiza um ritual da campanha' })
  @ApiBody({ type: UpdateCampaignRitualDto })
  @ApiOkResponse({ type: CampaignRitualDto })
  putCampaignRitual(
    @CurrentUser() user: AuthUser,
    @Param('characterId') characterId: string,
    @Param('ritualSlug') ritualSlug: string,
    @Body() body: UpdateCampaignRitualDto,
  ) {
    return this.charactersService.putCampaignRitual(
      user.id,
      characterId,
      ritualSlug,
      body,
    );
  }

  @Delete(':characterId/rituals/:ritualSlug')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove um ritual da campanha' })
  @ApiNoContentResponse({ description: 'Ritual removido' })
  async deleteCampaignRitual(
    @CurrentUser() user: AuthUser,
    @Param('characterId') characterId: string,
    @Param('ritualSlug') ritualSlug: string,
  ): Promise<void> {
    await this.charactersService.deleteCampaignRitual(
      user.id,
      characterId,
      ritualSlug,
    );
  }

  @Post(':characterId/inventory')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'GM adiciona item ao inventário exclusivo da campanha',
  })
  async addInventory(
    @CurrentUser() user: AuthUser,
    @Param('characterId') characterId: string,
    @Body() body: any,
  ): Promise<void> {
    await this.charactersService.addInventoryItem(user.id, characterId, body);
  }

  @Delete(':characterId/inventory/:inventoryId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'GM remove item do inventário exclusivo da campanha',
  })
  async removeInventory(
    @CurrentUser() user: AuthUser,
    @Param('characterId') characterId: string,
    @Param('inventoryId') inventoryId: string,
  ): Promise<void> {
    await this.charactersService.removeInventoryItem(
      user.id,
      characterId,
      inventoryId,
    );
  }
}
