import { randomUUID, createHash } from 'node:crypto';
import { GOOGLE_OAUTH_SCOPE } from './auth.constants';
import {
  createPkceCodeChallenge,
  createPkceCodeVerifier,
  signOAuthState,
} from './oauth-state';

function buildQueryString(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

export function buildGoogleAuthorizationUrl(options: {
  clientId: string;
  redirectUri: string;
  secret: string;
}): {
  authorizationUrl: string;
  oauthStateCookie: string;
} {
  const state = randomUUID();
  const codeVerifier = createPkceCodeVerifier();
  const codeChallenge = createPkceCodeChallenge(codeVerifier);
  const cookieValue = signOAuthState(
    {
      state,
      codeVerifier,
      createdAt: new Date().toISOString(),
    },
    options.secret,
  );

  const authorizationUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    buildQueryString({
      client_id: options.clientId,
      redirect_uri: options.redirectUri,
      response_type: 'code',
      scope: GOOGLE_OAUTH_SCOPE,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      prompt: 'select_account',
      access_type: 'offline',
      include_granted_scopes: 'true',
    });

  return { authorizationUrl, oauthStateCookie: cookieValue };
}

export async function exchangeGoogleCodeForProfile(options: {
  clientId: string;
  clientSecret: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<{
  accessToken: string;
  refreshToken?: string;
  profile: {
    sub: string;
    email: string;
    email_verified?: boolean;
    name: string;
    picture?: string;
  };
}> {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code: options.code,
      client_id: options.clientId,
      client_secret: options.clientSecret,
      code_verifier: options.codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: options.redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Google token exchange failed: ${tokenResponse.status}`);
  }

  const tokenJson = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
  };

  if (!tokenJson.access_token) {
    throw new Error('Google token response missing access_token');
  }

  if (!tokenJson.id_token) {
    throw new Error('Google token response missing id_token');
  }

  const tokenInfoResponse = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenJson.id_token)}`,
  );
  if (!tokenInfoResponse.ok) {
    throw new Error(
      `Google token validation failed: ${tokenInfoResponse.status}`,
    );
  }

  const tokenInfo = (await tokenInfoResponse.json()) as {
    aud?: string;
    email?: string;
    email_verified?: string;
    sub?: string;
    iss?: string;
  };

  const issuer = tokenInfo.iss;
  if (tokenInfo.aud !== options.clientId) {
    throw new Error('Google token audience mismatch');
  }

  if (
    issuer !== 'https://accounts.google.com' &&
    issuer !== 'accounts.google.com'
  ) {
    throw new Error('Google token issuer mismatch');
  }

  if (tokenInfo.email_verified !== 'true') {
    throw new Error('Google email not verified');
  }

  const profileResponse = await fetch(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    {
      headers: {
        authorization: `Bearer ${tokenJson.access_token}`,
      },
    },
  );

  if (!profileResponse.ok) {
    throw new Error(`Google profile lookup failed: ${profileResponse.status}`);
  }

  const profile = (await profileResponse.json()) as {
    sub: string;
    email: string;
    email_verified?: boolean;
    name: string;
    picture?: string;
  };

  if (!profile.sub || !profile.email || !profile.name) {
    throw new Error('Google profile missing required fields');
  }

  if (tokenInfo.sub && tokenInfo.sub !== profile.sub) {
    throw new Error('Google subject mismatch');
  }

  if (profile.email !== tokenInfo.email) {
    throw new Error('Google email mismatch');
  }

  return {
    accessToken: tokenJson.access_token,
    refreshToken: tokenJson.refresh_token,
    profile,
  };
}

export function createRefreshTokenId(): string {
  return randomUUID();
}

export function createTokenFingerprint(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
