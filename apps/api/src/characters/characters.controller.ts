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

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria uma ficha' })
  @ApiOkResponse({ description: 'Ficha criada' })
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.charactersService.createCharacter(user.id, body);
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

  @Delete(':characterId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Exclui uma ficha' })
  @ApiNoContentResponse({ description: 'Ficha removida' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('characterId') characterId: string,
  ): Promise<void> {
    await this.charactersService.deleteCharacter(user.id, characterId);
  }
}
