import type { CookieOptions } from 'express';
import { getEnvironment } from '../config/environment';

function getFrontendHosts(): string[] {
  return getEnvironment()
    .FRONTEND_BASE_URL.split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => new URL(entry).host);
}

export function hasSplitOrigins(): boolean {
  const environment = getEnvironment();
  const apiHost = new URL(environment.API_BASE_URL).host;
  return getFrontendHosts().some((host) => host !== apiHost);
}

export function usesCrossSiteCookies(): boolean {
  const environment = getEnvironment();
  if (environment.NODE_ENV !== 'production') {
    return false;
  }

  return hasSplitOrigins();
}

export function buildSessionCookieOptions(
  maxAgeSeconds: number,
): CookieOptions {
  const environment = getEnvironment();
  const crossSite = usesCrossSiteCookies();
  const sameSite = crossSite ? ('none' as const) : ('lax' as const);
  const secure = crossSite || environment.NODE_ENV === 'production';

  return {
    httpOnly: true,
    sameSite,
    secure,
    path: '/',
    domain: environment.COOKIE_DOMAIN || undefined,
    maxAge: maxAgeSeconds * 1000,
  };
}
