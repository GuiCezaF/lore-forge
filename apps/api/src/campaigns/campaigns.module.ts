import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { UsersModule } from '../users/users.module';
import { CampaignCharactersService } from './campaign-characters.service';
import { NpcStatBlocksService } from '../characters/npc-stat-blocks.service';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [CampaignsController],
  providers: [
    CampaignsService,
    CampaignCharactersService,
    NpcStatBlocksService,
  ],
  exports: [CampaignsService, CampaignCharactersService],
})
export class CampaignsModule {}
