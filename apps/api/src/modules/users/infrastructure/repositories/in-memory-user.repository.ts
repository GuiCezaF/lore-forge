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

  async findByProviderSubject(
    providerSubject: string,
  ): Promise<UserRecord | null> {
    const userId = this.usersByProviderSubject.get(providerSubject);
    if (!userId) return null;
    const user = this.usersById.get(userId) ?? null;
    return user;
  }

  async findByShortCode(shortCode: string): Promise<UserRecord | null> {
    for (const user of this.usersById.values()) {
      if (user.shortCode === shortCode) {
        return user;
      }
    }
    return null;
  }

  async findAll(): Promise<UserRecord[]> {
    return [...this.usersById.values()].filter((user) => !user.deletedAt);
  }

  async save(user: UserRecord): Promise<void> {
    this.usersById.set(user.id, user);
    this.usersByProviderSubject.set(user.providerSubject, user.id);
  }

  async softDelete(id: string, deletedAt: string): Promise<void> {
    const user = this.usersById.get(id);
    if (!user) return;
    this.usersById.set(id, {
      ...user,
      deletedAt,
      updatedAt: deletedAt,
      tokenVersion: user.tokenVersion + 1,
    });
  }

  async incrementTokenVersion(id: string): Promise<void> {
    const user = this.usersById.get(id);
    if (!user) {
      return;
    }
    this.usersById.set(id, {
      ...user,
      tokenVersion: user.tokenVersion + 1,
    });
  }
}
