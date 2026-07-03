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
import { ItemsService } from './items.service';

@Controller('items')
@ApiTags('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista itens acessíveis' })
  @ApiOkResponse({ description: 'Itens' })
  list(@CurrentUser() user: AuthUser) {
    return this.itemsService.listMyItems(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria um item' })
  @ApiOkResponse({ description: 'Item criado' })
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.itemsService.createItem(user.id, body);
  }

  @Get(':itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalha um item' })
  @ApiOkResponse({ description: 'Item' })
  get(@CurrentUser() user: AuthUser, @Param('itemId') itemId: string) {
    return this.itemsService.getItem(user.id, itemId);
  }

  @Patch(':itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza um item' })
  @ApiOkResponse({ description: 'Item atualizado' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('itemId') itemId: string,
    @Body() body: any,
  ) {
    return this.itemsService.updateItem(user.id, itemId, body);
  }

  @Delete(':itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Exclui um item' })
  @ApiNoContentResponse({ description: 'Item removido' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('itemId') itemId: string,
  ): Promise<void> {
    await this.itemsService.deleteItem(user.id, itemId);
  }

  @Post(':itemId/clone')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clona um item' })
  @ApiOkResponse({ description: 'Item copiado' })
  clone(
    @CurrentUser() user: AuthUser,
    @Param('itemId') itemId: string,
    @Body() body: any,
  ) {
    return this.itemsService.cloneItem(user.id, itemId, body);
  }
}
