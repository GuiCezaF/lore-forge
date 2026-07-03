export interface AuthSessionRecord {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: string;
  createdAt: string;
  revokedAt?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}
