import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { SpectatorAccessController } from './spectator-access.controller';
import { SpectatorAccessService } from './spectator-access.service';

@Module({ imports: [AuthModule, MediaModule], controllers: [SpectatorAccessController], providers: [SpectatorAccessService] })
export class SpectatorAccessModule {}
