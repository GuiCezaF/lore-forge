import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<Pick<UsersService, 'getProfile'>>;

  const authUser: AuthUser = {
    id: 'user-1',
    provider: 'google',
    providerSubject: 'google:sub-1',
    email: 'player@loreforge.test',
    name: 'Player',
    role: 'user',
    plan: 'free',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    tokenVersion: 0,
  };

  beforeEach(async () => {
    usersService = {
      getProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('getMe', () => {
    it('returns public profile for authenticated user', async () => {
      const profile = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
        picture: authUser.picture,
        provider: authUser.provider,
        role: authUser.role,
        plan: authUser.plan,
        createdAt: authUser.createdAt,
        updatedAt: authUser.updatedAt,
        lastLoginAt: authUser.lastLoginAt,
      };
      usersService.getProfile.mockResolvedValue(profile as any);

      const result = await controller.getMe(authUser);
      expect(result).toEqual(profile);
      expect(usersService.getProfile).toHaveBeenCalledWith(authUser.id);
    });
  });
});
