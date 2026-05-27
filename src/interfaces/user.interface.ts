import { AuthUser } from './auth-user.interface';
import { UpdateQuery } from 'mongoose';
export interface IUserRepository {
  findByPk(userId: string): Promise<AuthUser | null>;

  findAll(userId: string, page?: number, limit?: number): Promise<AuthUser[]>;

  count(userId: string): Promise<number>;

  create(data: Partial<AuthUser>): Promise<AuthUser>;

  update(data: UpdateQuery<AuthUser>, where: Partial<AuthUser>): Promise<void>;

  destroy(where: Partial<AuthUser>): Promise<void>;

  findPendingVerification(): Promise<AuthUser[]>;

  findMany(filter: any): Promise<any[]>;
}
