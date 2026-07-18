import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import {
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_LIFETIME_SECONDS,
} from './auth.constants';
import { buildSessionCookieOptions } from './auth-cookies';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthUser } from './auth.types';

function isBypassProfile(
  profile: string | undefined,
): profile is 'gm' | 'player' {
  return profile === 'gm' || profile === 'player';
}

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @ApiOperation({ summary: 'Inicia o fluxo OAuth2 do Google' })
  loginWithGoogle(@Res() res: Response) {
    const { authorizationUrl, oauthStateCookie } =
      this.authService.buildGoogleLogin();

    res.cookie(
      OAUTH_STATE_COOKIE,
      oauthStateCookie,
      buildSessionCookieOptions(OAUTH_STATE_LIFETIME_SECONDS),
    );

    return res.redirect(authorizationUrl);
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Finaliza o login com o Google' })
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() request: Request,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      throw new UnauthorizedException('Missing OAuth callback parameters');
    }

    const session = await this.authService.handleGoogleCallback({
      code,
      state,
      stateCookie: request.headers.cookie,
    });

    if (this.authService.shouldUseAuthHandoff()) {
      return res.redirect(this.authService.buildHandoffRedirectUrl(session));
    }

    this.authService.attachAuthCookies(res, session);
    return res.redirect(this.authService.getPostLoginRedirectUrl());
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotaciona o refresh token e emite novos cookies' })
  async refresh(@Req() request: Request, @Res() res: Response) {
    const session = await this.authService.refreshFromCookies(
      request.headers.cookie,
    );
    this.authService.attachAuthCookies(res, session);
    return res.status(200).json(session.user);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Revoga a sessão atual' })
  async logout(@Req() request: Request, @Res() res: Response) {
    await this.authService.logoutFromCookies(request.headers.cookie);
    this.authService.clearAuthCookies(res);
    return res.status(204).send();
  }

  @Get('bypass')
  @ApiExcludeEndpoint()
  async bypass(
    @Query('profile') profile: string | undefined,
    @Res() res: Response,
  ) {
    if (this.authService.isProduction()) {
      throw new UnauthorizedException(
        'Bypass only available in development mode',
      );
    }
    if (profile && process.env.NODE_ENV !== 'test') {
      throw new BadRequestException(
        'Bypass profiles are only available in test mode',
      );
    }
    if (profile && !isBypassProfile(profile)) {
      throw new BadRequestException('Invalid bypass profile');
    }
    const session = await this.authService.bypassLogin(
      isBypassProfile(profile) ? profile : undefined,
    );
    if (this.authService.shouldUseAuthHandoff()) {
      return res.redirect(this.authService.buildHandoffRedirectUrl(session));
    }
    this.authService.attachAuthCookies(res, session);
    return res.redirect(this.authService.getPostLoginRedirectUrl());
  }

  @Get('handoff/redeem')
  @ApiOperation({
    summary: 'Troca um token de handoff OAuth por tokens de sessão',
  })
  async redeemHandoff(@Query('token') token: string | undefined) {
    if (!token) {
      throw new UnauthorizedException('Missing handoff token');
    }

    return this.authService.redeemHandoffToken(token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna a sessão autenticada' })
  @ApiOkResponse({ description: 'Sessão atual' })
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
