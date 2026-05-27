import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import type { IUserRepository } from 'src/interfaces/user.interface';
import { AuthUser } from 'src/interfaces/auth-user.interface';
import { UserRole, VerificationStatus } from 'src/enums/user.enum';
import cloudinary, { uploadToCloudinary } from 'src/libs/cloudinary';
import { response } from 'src/libs/helpers';
import { messages } from 'src/libs/messages';
import { NotificationService } from './notification.service';
import { NotificationType } from 'src/enums/notification.enum';
import { UserCleanupService } from './user-clean-up.service';

@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,

    private readonly notificationService: NotificationService,
    private readonly userCleanupService: UserCleanupService,
  ) {}

  async getAllUsers(userId: string, page = 1, limit = 10) {
    const [users, total] = await Promise.all([
      this.userRepository.findAll(userId, page, limit),
      this.userRepository.count(userId),
    ]);

    return response({
      data: {
        users,
        total,
        page,
        limit,
        hasMore: page * limit < total,
      },
      message: null,
    });
  }

  async getUser(userId: string) {
    const user = await this.userRepository.findByPk(userId);

    if (!user) {
      throw new NotFoundException(messages.user.getUser.notFound);
    }

    return response(user, null);
  }

  async deleteUser(userId: string) {
    const user = await this.userRepository.findByPk(userId);

    if (!user) {
      throw new NotFoundException(messages.user.deleteUser.notFound);
    }

    await this.userCleanupService.cleanup(userId);

    await this.userRepository.destroy({ _id: userId });

    return response(null, messages.user.deleteUser.success);
  }
  async updateUserRole(authUser: AuthUser, userId: string, role: UserRole) {
    const admin = await this.userRepository.findByPk(authUser._id);

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new UnauthorizedException(messages.user.updateRole.unauthorized);
    }

    const allowedRoles = [
      UserRole.CLIENT,
      UserRole.FREELANCER,
      UserRole.SUPPORT,
    ];

    if (!allowedRoles.includes(role)) {
      throw new BadRequestException(messages.user.updateRole.invalidRole);
    }

    const user = await this.userRepository.findByPk(userId);

    if (!user) {
      throw new NotFoundException(messages.user.updateRole.notFound);
    }

    await this.userRepository.update({ role }, { _id: userId });

    return response({ ...user, role }, messages.user.updateRole.success);
  }

  async updateAvatar(authUser: AuthUser, file?: Express.Multer.File) {
    const user = await this.userRepository.findByPk(authUser._id);

    if (!user) {
      throw new UnauthorizedException(messages.user.avatar.notFound);
    }

    if (!file) {
      throw new BadRequestException(messages.user.avatar.fileRequired);
    }

    const extractPublicId = (url: string) => {
      const parts = url.split('/');
      const file = parts.pop()!;
      return file.split('.')[0];
    };

    if (
      user.avatar?.includes('res.cloudinary.com') &&
      !user.avatar.includes('avatar-default-image')
    ) {
      const oldId = extractPublicId(user.avatar);
      await cloudinary.v2.uploader.destroy(`users/avatars/${oldId}`);
    }

    const upload = await uploadToCloudinary(file, 'users/avatars');

    await this.userRepository.update(
      { avatar: upload.secure_url },
      { _id: authUser._id },
    );

    return response({
      data: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        avatar: upload.secure_url,
        role: user.role,
      },
      message: messages.user.avatar.success,
    });
  }

  async uploadIdentity(
    authUser: AuthUser,
    files: {
      idCard?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
    },
  ) {
    const user = await this.userRepository.findByPk(authUser._id);

    if (!user) {
      throw new NotFoundException(messages.user.identity.notFound);
    }

    if (!files.idCard || !files.selfie) {
      throw new BadRequestException('Both images are required');
    }

    if (user.verificationStatus === VerificationStatus.VERIFIED) {
      throw new BadRequestException(messages.user.identity.alreadyVerified);
    }

    const idCard = await uploadToCloudinary(files.idCard[0], 'kyc');
    const selfie = await uploadToCloudinary(files.selfie[0], 'kyc');

    await this.userRepository.update(
      {
        idCardImage: idCard.secure_url,
        selfieImage: selfie.secure_url,
        verificationStatus: VerificationStatus.PENDING,
      },
      { _id: authUser._id },
    );

    const admins = await this.userRepository.findMany({
      role: UserRole.ADMIN,
    });

    await Promise.all(
      admins.map((admin) =>
        this.notificationService.createNotification({
          receiverId: admin._id.toString(),
          senderId: user._id.toString(),
          type: NotificationType.VERIFY,
          targetId: user._id.toString(),
          isRead: false,
        }),
      ),
    );

    return response(VerificationStatus.PENDING, messages.user.identity.success);
  }

  async getVerificationRequests(admin: AuthUser) {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException(messages.user.requests.forbidden);
    }

    const users = await this.userRepository.findPendingVerification();

    return response({
      data: {
        count: users.length,
        users,
      },
      message: messages.user.requests.success,
    });
  }

  async verifyUser(
    admin: AuthUser,
    userId: string,
    status: VerificationStatus,
  ) {
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException(messages.user.verification.forbidden);
    }

    const allowed = [VerificationStatus.VERIFIED, VerificationStatus.REJECTED];

    if (!allowed.includes(status)) {
      throw new BadRequestException(messages.user.verification.invalidStatus);
    }

    const user = await this.userRepository.findByPk(userId);

    if (!user) {
      throw new NotFoundException(messages.user.verification.notFound);
    }

    await this.userRepository.update(
      { verificationStatus: status },
      { _id: userId },
    );

    await this.notificationService.createNotification({
      receiverId: user._id.toString(),
      senderId: admin._id.toString(),
      type: NotificationType.VERIFY,
      targetId: user._id.toString(),
      isRead: false,
    });

    return response({
      data: {
        _id: user._id,
        fullname: user.fullname,
        verificationStatus: status,
      },
      message: `User ${status.toLowerCase()} successfully`,
    });
  }
}
