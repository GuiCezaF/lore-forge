import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ACCESS_TOKEN_COOKIE } from '../auth.constants';
import { AuthService } from '../auth.service';

function readCookie(
  cookieHeader: string | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  return cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function readBearerToken(
  authorizationHeader: string | undefined,
): string | undefined {
  if (!authorizationHeader) {
    return undefined;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return undefined;
  }
  return token;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: unknown }>();
    const token =
      readBearerToken(request.headers.authorization) ??
      readCookie(request.headers.cookie, ACCESS_TOKEN_COOKIE);

    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      request.user = await this.authService.verifyAccessToken(token);
    } catch (error) {
      throw new UnauthorizedException((error as Error).message);
    }
    return true;
  }
}
