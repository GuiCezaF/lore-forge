import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CampaignInventoryController } from './campaign-inventory.controller';
import { CampaignInventoryService } from './campaign-inventory.service';
@Module({
  imports: [AuthModule],
  controllers: [CampaignInventoryController],
  providers: [CampaignInventoryService],
})
export class CampaignInventoryModule {}
