import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import path from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { CharactersModule } from './characters/characters.module';
import { ItemsModule } from './items/items.module';
import { MediaModule } from './media/media.module';
import { MonstersModule } from './monsters/monsters.module';
import { UsersModule } from './users/users.module';
import { RulesModule } from './rules/rules.module';
import { NpcTemplatesModule } from './npc-templates/npc-templates.module';
import { CampaignCluesModule } from './campaign-clues/campaign-clues.module';
import { validateEnvironment } from './config/environment';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [path.resolve(process.cwd(), '.env')],
      validate: (rawEnvironment) =>
        validateEnvironment(rawEnvironment as Record<string, unknown>),
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    MediaModule,
    CampaignsModule,
    CampaignCluesModule,
    CharactersModule,
    MonstersModule,
    ItemsModule,
    RulesModule,
    NpcTemplatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
