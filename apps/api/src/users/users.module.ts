import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { InMemoryUserRepository } from '../modules/users/infrastructure/repositories/in-memory-user.repository';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [
    { provide: 'IUserRepository', useClass: InMemoryUserRepository },
    UsersService,
    InMemoryUserRepository,
  ],
  exports: [UsersService],
})
export class UsersModule {}
