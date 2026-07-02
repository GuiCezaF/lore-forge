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
import { MonstersService } from './monsters.service';

@Controller('monsters')
@ApiTags('monsters')
export class MonstersController {
  constructor(private readonly monstersService: MonstersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista monstros acessíveis' })
  @ApiOkResponse({ description: 'Monstros' })
  list(@CurrentUser() user: AuthUser) {
    return this.monstersService.listMyMonsters(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria um monstro' })
  @ApiOkResponse({ description: 'Monstro criado' })
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.monstersService.createMonster(user.id, body);
  }

  @Get(':monsterId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalha um monstro' })
  @ApiOkResponse({ description: 'Monstro' })
  get(@CurrentUser() user: AuthUser, @Param('monsterId') monsterId: string) {
    return this.monstersService.getMonster(user.id, monsterId);
  }

  @Patch(':monsterId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza um monstro' })
  @ApiOkResponse({ description: 'Monstro atualizado' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('monsterId') monsterId: string,
    @Body() body: any,
  ) {
    return this.monstersService.updateMonster(user.id, monsterId, body);
  }

  @Delete(':monsterId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Exclui um monstro' })
  @ApiNoContentResponse({ description: 'Monstro removido' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('monsterId') monsterId: string,
  ): Promise<void> {
    await this.monstersService.deleteMonster(user.id, monsterId);
  }

  @Post(':monsterId/clone')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clona um monstro' })
  @ApiOkResponse({ description: 'Monstro copiado' })
  clone(
    @CurrentUser() user: AuthUser,
    @Param('monsterId') monsterId: string,
    @Body() body: any,
  ) {
    return this.monstersService.cloneMonster(user.id, monsterId, body);
  }
}
