import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RulesService } from './rules.service';

@Controller('rulesets')
@ApiTags('rulesets')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get(':version')
  @ApiOperation({
    summary: 'Returns the versioned rules catalog used by character sheets',
  })
  getCatalog(@Param('version') version: string) {
    return this.rulesService.getCatalog(version);
  }
}
