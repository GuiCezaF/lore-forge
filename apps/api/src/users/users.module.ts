import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DrizzleUserRepository } from '../modules/users/infrastructure/repositories/drizzle-user.repository';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [
    { provide: 'IUserRepository', useClass: DrizzleUserRepository },
    UsersService,
    DrizzleUserRepository,
  ],
  exports: [UsersService],
})
export class UsersModule {}
