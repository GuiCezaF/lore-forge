export const GOOGLE_OAUTH_SCOPE = ['openid', 'email', 'profile'].join(' ');

export const ACCESS_TOKEN_COOKIE = 'loreforge_access_token';
export const REFRESH_TOKEN_COOKIE = 'loreforge_refresh_token';
export const OAUTH_STATE_COOKIE = 'loreforge_oauth_state';

export const ACCESS_TOKEN_LIFETIME_SECONDS = 15 * 60;
export const REFRESH_TOKEN_LIFETIME_SECONDS = 30 * 24 * 60 * 60;
export const OAUTH_STATE_LIFETIME_SECONDS = 15 * 60;

export const AUTH_ISSUER = 'loreforge-api';
export const AUTH_AUDIENCE = 'loreforge-web';
