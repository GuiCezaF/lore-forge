import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { UsersService } from './users.service';

interface UpdateMeBody {
  name?: string;
  picture?: string | null;
}

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista usuários ativos' })
  @ApiOkResponse({ description: 'Usuários ativos' })
  listUsers() {
    return this.usersService.findAllPublicUsers();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna o perfil autenticado' })
  @ApiOkResponse({ description: 'Perfil autenticado' })
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza nome e foto do usuário' })
  @ApiOkResponse({ description: 'Perfil atualizado' })
  updateMe(@CurrentUser() user: AuthUser, @Body() body: UpdateMeBody) {
    return this.usersService.updateProfile(user.id, body);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Exclui a conta do usuário' })
  @ApiNoContentResponse({ description: 'Conta excluída' })
  async deleteMe(@CurrentUser() user: AuthUser): Promise<void> {
    await this.usersService.deleteAccount(user.id);
  }

  @Get('code/:shortCode')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca usuário pelo identificador curto' })
  @ApiOkResponse({ description: 'Usuário encontrado' })
  getByShortCode(@Param('shortCode') shortCode: string) {
    return this.usersService.findPublicByShortCode(shortCode);
  }
}
