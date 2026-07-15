import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { CampaignCluesController } from './campaign-clues.controller';
import { CampaignCluesService } from './campaign-clues.service';

@Module({
  imports: [AuthModule, CampaignsModule],
  controllers: [CampaignCluesController],
  providers: [CampaignCluesService],
})
export class CampaignCluesModule {}
