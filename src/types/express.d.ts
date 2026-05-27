import { AuthUser } from 'src/interfaces/auth-user.interface';

export interface RequestWithUser extends Request {
  user: AuthUser;
}
