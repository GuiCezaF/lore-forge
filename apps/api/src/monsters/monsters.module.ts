import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { MonstersController } from './monsters.controller';
import { MonstersService } from './monsters.service';

@Module({
  imports: [CampaignsModule, AuthModule],
  controllers: [MonstersController],
  providers: [MonstersService],
  exports: [MonstersService],
})
export class MonstersModule {}
