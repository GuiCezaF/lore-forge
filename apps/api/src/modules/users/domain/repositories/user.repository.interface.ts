import type { UserRecord } from '../../../../users/users.types';

export interface IUserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByProviderSubject(providerSubject: string): Promise<UserRecord | null>;
  save(user: UserRecord): Promise<void>;
  remove(id: string): Promise<void>;
}
