import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UsersModule } from '../users/users.module';
import { DrizzleAuthSessionRepository } from './infrastructure/drizzle-auth-session.repository';

@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [AuthController],
  providers: [
    {
      provide: 'IAuthSessionRepository',
      useClass: DrizzleAuthSessionRepository,
    },
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    DrizzleAuthSessionRepository,
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
