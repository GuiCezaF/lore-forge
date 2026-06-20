import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { HelloResponseDto } from './hello-response.dto';

@Controller()
@ApiTags('app')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Retorna uma saudação inicial' })
  @ApiOkResponse({ type: HelloResponseDto })
  getHello(): HelloResponseDto {
    return this.appService.getHello();
  }
}
