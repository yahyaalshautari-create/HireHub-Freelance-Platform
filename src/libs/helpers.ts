import { ForbiddenException } from '@nestjs/common';
import { UserRole } from 'src/enums/user.enum';
import { AuthUser } from 'src/interfaces/auth-user.interface';

export function sanitizeUser(user: any) {
  const obj = user.toObject?.() || user;
  const { password, verificationStatus, ...safe } = obj;
  return safe;
}

export function response(data: any, message: string | null = null) {
  return {
    message,
    data,
  };
}

export function assertOwnerOrAdmin(params: {
  ownerId: string;
  authUser: AuthUser;
  message?: string;
}) {
  const { ownerId, authUser, message = 'Unauthorized' } = params;

  const isOwner = ownerId === authUser._id;
  const isAdmin = authUser.role === UserRole.ADMIN;

  if (!isOwner && !isAdmin) {
    throw new ForbiddenException(message);
  }

  return true;
}
