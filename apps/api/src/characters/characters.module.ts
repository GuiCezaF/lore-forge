import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';
import { RulesModule } from '../rules/rules.module';
import { MediaModule } from '../media/media.module';
import { NpcStatBlocksService } from './npc-stat-blocks.service';

@Module({
  imports: [CampaignsModule, AuthModule, RulesModule, MediaModule],
  controllers: [CharactersController],
  providers: [CharactersService, NpcStatBlocksService],
  exports: [CharactersService],
})
export class CharactersModule {}
