import { AuthUser } from './auth-user.interface';

export interface IAuthRepository {
  findByEmail(email: string): Promise<AuthUser | null>;

  create(data: Partial<AuthUser>): Promise<AuthUser>;

  findByPk(userId: string): Promise<AuthUser | null>;
}
