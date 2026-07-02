import type { UserRecord } from '../../../../users/users.types';

export interface IUserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByProviderSubject(providerSubject: string): Promise<UserRecord | null>;
  findByShortCode(shortCode: string): Promise<UserRecord | null>;
  findAll(): Promise<UserRecord[]>;
  save(user: UserRecord): Promise<void>;
  softDelete(id: string, deletedAt: string): Promise<void>;
}
