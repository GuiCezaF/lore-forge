import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { InMemoryUserRepository } from '../modules/users/infrastructure/repositories/in-memory-user.repository';

describe('UsersService', () => {
  let service: UsersService;
  let repo: InMemoryUserRepository;

  const googleProfile = {
    sub: 'google-subject-1',
    email: 'player@loreforge.test',
    name: 'Player One',
    picture: 'https://example.com/avatar.png',
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'users-service-test-secret';
    repo = new InMemoryUserRepository();
    service = new UsersService(repo);
  });

  describe('upsertGoogleUser', () => {
    it('creates a new user with default role, plan and short code', async () => {
      const user = await service.upsertGoogleUser(googleProfile);

      expect(user.email).toBe(googleProfile.email);
      expect(user.role).toBe('user');
      expect(user.plan).toBe('free');
      expect(user.tokenVersion).toBe(0);
      expect(user.shortCode).toMatch(/^lf-/);
    });

    it('updates profile data on subsequent logins', async () => {
      const first = await service.upsertGoogleUser(googleProfile);
      const updated = await service.upsertGoogleUser({
        ...googleProfile,
        name: 'Player Updated',
      });

      expect(updated.id).toBe(first.id);
      expect(updated.name).toBe('Player Updated');
    });
  });

  describe('profile operations', () => {
    it('returns auth user by id', async () => {
      const created = await service.upsertGoogleUser(googleProfile);
      const found = await service.findAuthUserById(created.id);

      expect(found.email).toBe(created.email);
      expect(found.shortCode).toBe(created.shortCode);
    });

    it('returns public profile by short code', async () => {
      const created = await service.upsertGoogleUser(googleProfile);
      const found = await service.findPublicByShortCode(created.shortCode);

      expect(found.id).toBe(created.id);
      expect(found.shortCode).toBe(created.shortCode);
    });

    it('updates name and picture', async () => {
      const created = await service.upsertGoogleUser(googleProfile);
      const profile = await service.updateProfile(created.id, {
        name: 'New Name',
        picture: null,
      });

      expect(profile.name).toBe('New Name');
      expect(profile.picture).toBeUndefined();
    });

    it('soft deletes account and blocks access after deletion', async () => {
      const created = await service.upsertGoogleUser(googleProfile);
      await service.deleteAccount(created.id);

      await expect(service.findAuthUserById(created.id)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(
        service.findPublicByShortCode(created.shortCode),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
