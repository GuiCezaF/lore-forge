export type AuthPlan = 'free' | 'premium';
export type AuthRole = 'user' | 'admin';
export type OAuthProvider = 'google';

export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified?: boolean;
  name: string;
  picture?: string;
}

export interface AuthUser {
  id: string;
  provider: OAuthProvider;
  providerSubject: string;
  email: string;
  name: string;
  picture?: string;
  role: AuthRole;
  plan: AuthPlan;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  refreshTokenHash?: string | null;
  refreshTokenExpiresAt?: string | null;
  tokenVersion: number;
}

export interface AccessTokenClaims {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  role: AuthRole;
  plan: AuthPlan;
  tokenVersion: number;
}

export interface RefreshTokenClaims {
  sub: string;
  tokenVersion: number;
  jti: string;
}

export interface SignedOAuthState {
  state: string;
  codeVerifier: string;
  createdAt: string;
}
