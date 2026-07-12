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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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

  @Get('ruleset')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Returns the database-backed character rules catalog' })
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
      return this.charactersService.createNpc(user.id, body.campaignId, body);
    }
    return this.charactersService.createPlayerCharacter(user.id, body);
  }

  @Post('drafts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria um rascunho persistido de ficha de jogador' })
  createDraft(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.charactersService.createDraft(user.id, body);
  }

  @Patch(':characterId/draft')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Salva automaticamente um rascunho de ficha' })
  saveDraft(@CurrentUser() user: AuthUser, @Param('characterId') characterId: string, @Body() body: any) {
    return this.charactersService.saveDraft(user.id, characterId, body);
  }

  @Post(':characterId/copy')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Copia apenas a ficha permanente de um personagem' })
  copy(@CurrentUser() user: AuthUser, @Param('characterId') characterId: string, @Body() body: { sheetLabel?: string }) {
    return this.charactersService.copyCharacter(user.id, characterId, body?.sheetLabel);
  }

  @Post(':characterId/archive')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Arquiva uma ficha vinculada à campanha' })
  async archive(@CurrentUser() user: AuthUser, @Param('characterId') characterId: string): Promise<void> {
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
  playState(@CurrentUser() user: AuthUser, @Param('characterId') characterId: string) {
    return this.charactersService.getCampaignPlayState(user.id, characterId);
  }

  @Get(':characterId/npc-stat-block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtém o bloco de ameaça tipado de um NPC' })
  npcStatBlock(@CurrentUser() user: AuthUser, @Param('characterId') characterId: string) {
    return this.charactersService.getNpcStatBlock(user.id, characterId);
  }

  @Patch(':characterId/play-state')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza o estado de jogo da própria ficha na campanha' })
  async updatePlayState(@CurrentUser() user: AuthUser, @Param('characterId') characterId: string, @Body() body: any): Promise<void> {
    await this.charactersService.updateCampaignState(user.id, characterId, body);
  }

  @Post(':characterId/inventory')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'GM adiciona item ao inventário exclusivo da campanha' })
  async addInventory(@CurrentUser() user: AuthUser, @Param('characterId') characterId: string, @Body() body: any): Promise<void> {
    await this.charactersService.addInventoryItem(user.id, characterId, body);
  }

  @Delete(':characterId/inventory/:inventoryId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'GM remove item do inventário exclusivo da campanha' })
  async removeInventory(@CurrentUser() user: AuthUser, @Param('characterId') characterId: string, @Param('inventoryId') inventoryId: string): Promise<void> {
    await this.charactersService.removeInventoryItem(user.id, characterId, inventoryId);
  }

}
