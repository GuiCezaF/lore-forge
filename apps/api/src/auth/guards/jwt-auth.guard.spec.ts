import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { ACCESS_TOKEN_COOKIE } from '../auth.constants';
import { InMemoryUserRepository } from '../../modules/users/infrastructure/repositories/in-memory-user.repository';
import { InMemoryAuthSessionRepository } from '../infrastructure/in-memory-auth-session.repository';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let authService: AuthService;
  let usersService: UsersService;
  let userRepo: InMemoryUserRepository;
  let sessionRepo: InMemoryAuthSessionRepository;

  const googleProfile = {
    sub: 'guard-google-subject',
    email: 'guard@loreforge.test',
    name: 'Guard User',
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'jwt-guard-test-secret';
    userRepo = new InMemoryUserRepository();
    sessionRepo = new InMemoryAuthSessionRepository();
    usersService = new UsersService(userRepo);
    authService = new AuthService(usersService, sessionRepo);
    guard = new JwtAuthGuard(authService);
  });

  function buildContext(options: {
    authorization?: string;
    cookie?: string;
    user?: unknown;
  }): ExecutionContext {
    const request = {
      headers: {
        authorization: options.authorization,
        cookie: options.cookie,
      },
      user: options.user,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  }

  it('accepts bearer token and attaches user to request', async () => {
    const user = await usersService.upsertGoogleUser(googleProfile);
    const session = await authService.createSession(user);
    const context = buildContext({
      authorization: `Bearer ${session.accessToken}`,
    });
    const request = context.switchToHttp().getRequest<{ user?: unknown }>();

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toMatchObject({ id: user.id, email: user.email });
  });

  it('accepts access token from cookie', async () => {
    const user = await usersService.upsertGoogleUser(googleProfile);
    const session = await authService.createSession(user);
    const context = buildContext({
      cookie: `${ACCESS_TOKEN_COOKIE}=${session.accessToken}`,
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('rejects request without token', async () => {
    const context = buildContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects invalid token', async () => {
    const context = buildContext({
      authorization: 'Bearer invalid-token',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
