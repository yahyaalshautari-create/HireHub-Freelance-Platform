import { UserRole, VerificationStatus } from 'src/enums/user.enum';

export interface AuthUser {
  _id: string;
  fullname: string;
  email: string;
  password: string;
  role: UserRole;
  avatar: string;
  balance: number;
  frozenBalance: number;
  verificationStatus: VerificationStatus;
  idCardImage: string;
  selfieImage: string;
}
