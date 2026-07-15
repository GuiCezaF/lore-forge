import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { NpcStatBlocksService } from '../characters/npc-stat-blocks.service';
import { NpcTemplatesController } from './npc-templates.controller';
import { NpcTemplatesService } from './npc-templates.service';
@Module({
  imports: [AuthModule, MediaModule],
  controllers: [NpcTemplatesController],
  providers: [NpcTemplatesService, NpcStatBlocksService],
})
export class NpcTemplatesModule {}
