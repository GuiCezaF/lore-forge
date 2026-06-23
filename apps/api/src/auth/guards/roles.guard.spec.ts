import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthUser } from '../auth.types';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const baseUser: AuthUser = {
    id: 'user-1',
    provider: 'google',
    providerSubject: 'google:sub-1',
    email: 'player@loreforge.test',
    name: 'Player',
    role: 'user',
    plan: 'free',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tokenVersion: 0,
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function buildContext(user?: AuthUser): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as ExecutionContext;
  }

  it('allows access when route has no role metadata', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(buildContext(baseUser))).toBe(true);
  });

  it('allows access when user role matches requirement', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['user', 'admin']);

    expect(guard.canActivate(buildContext(baseUser))).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      expect.anything(),
      expect.anything(),
    ]);
  });

  it('rejects unauthenticated request on protected route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    expect(() => guard.canActivate(buildContext(undefined))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects user with insufficient role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    expect(() => guard.canActivate(buildContext(baseUser))).toThrow(
      ForbiddenException,
    );
  });
});
