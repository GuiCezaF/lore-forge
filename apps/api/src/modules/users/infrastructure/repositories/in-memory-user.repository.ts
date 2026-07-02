import { Injectable } from '@nestjs/common';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import type { UserRecord } from '../../../../users/users.types';

@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private readonly usersById = new Map<string, UserRecord>();
  private readonly usersByProviderSubject = new Map<string, string>();

  async findById(id: string): Promise<UserRecord | null> {
    const user = this.usersById.get(id) ?? null;
    return user;
  }

  async findByProviderSubject(providerSubject: string): Promise<UserRecord | null> {
    const userId = this.usersByProviderSubject.get(providerSubject);
    if (!userId) return null;
    const user = this.usersById.get(userId) ?? null;
    return user;
  }

  async save(user: UserRecord): Promise<void> {
    this.usersById.set(user.id, user);
    this.usersByProviderSubject.set(user.providerSubject, user.id);
  }

  async remove(id: string): Promise<void> {
    const user = this.usersById.get(id);
    if (!user) return;
    this.usersById.delete(id);
    this.usersByProviderSubject.delete(user.providerSubject);
  }
}
