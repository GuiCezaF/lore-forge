import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { NpcStatBlocksService } from '../characters/npc-stat-blocks.service';
import { NpcTemplatesController } from './npc-templates.controller';
import { NpcTemplatesService } from './npc-templates.service';
@Module({
  imports: [MediaModule],
  controllers: [NpcTemplatesController],
  providers: [NpcTemplatesService, NpcStatBlocksService],
})
export class NpcTemplatesModule {}
