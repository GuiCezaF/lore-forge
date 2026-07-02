import { AuthPlan, AuthRole, OAuthProvider } from '../auth/auth.types';

export interface UserRecord {
  id: string;
  provider: OAuthProvider;
  providerSubject: string;
  email: string;
  shortCode: string;
  name: string;
  picture?: string;
  role: AuthRole;
  plan: AuthPlan;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  lastLoginAt?: string;
  tokenVersion: number;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  shortCode: string;
  provider: OAuthProvider;
  role: AuthRole;
  plan: AuthPlan;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  lastLoginAt?: string;
}
