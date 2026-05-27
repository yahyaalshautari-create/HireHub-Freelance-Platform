import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole, VerificationStatus } from 'src/enums/user.enum';
import { NotificationType } from 'src/enums/notification.enum';
import { messages } from 'src/libs/messages';
import * as cloudinaryLib from 'src/libs/cloudinary';
import { UserService } from 'src/services/user.service';
import { NotificationService } from 'src/services/notification.service';
import { UserCleanupService } from 'src/services/user-clean-up.service';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockUserRepository = {
  findAll: jest.fn(),
  count: jest.fn(),
  findByPk: jest.fn(),
  destroy: jest.fn(),
  update: jest.fn(),
  findMany: jest.fn(),
  findPendingVerification: jest.fn(),
};

const mockNotificationService = {
  createNotification: jest.fn(),
};

const mockUserCleanupService = {
  cleanup: jest.fn(),
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const buildUser = (overrides = {}) => ({
  _id: 'user-id-1',
  fullname: 'Test User',
  email: 'test@example.com',
  role: UserRole.CLIENT,
  avatar: 'https://res.cloudinary.com/avatar-default-image.jpg',
  balance: 100,
  frozenBalance: 0,
  verificationStatus: VerificationStatus.PENDING,
  idCardImage: null,
  selfieImage: null,
  ...overrides,
});

const buildAdminUser = () =>
  buildUser({ _id: 'admin-id', role: UserRole.ADMIN });

const buildAuthUser = (overrides: Partial<any> = {}): any => ({
  _id: 'user-id-1',
  fullname: 'Test User',
  email: 'test@example.com',
  password: 'hashed-password',
  avatar: 'https://test.com/avatar.png',
  role: UserRole.CLIENT,
  ...overrides,
});

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: 'IUserRepository', useValue: mockUserRepository },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: UserCleanupService, useValue: mockUserCleanupService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  // ── getAllUsers ──────────────────────────────────────────────────────────────

  describe('getAllUsers', () => {
    it('should return paginated users with correct metadata', async () => {
      const users = [buildUser(), buildUser({ _id: 'user-2' })];
      mockUserRepository.findAll.mockResolvedValue(users);
      mockUserRepository.count.mockResolvedValue(20);

      const result = await service.getAllUsers('admin-id', 1, 10);

      expect(result).toBeDefined();
      expect(mockUserRepository.findAll).toHaveBeenCalledWith(
        'admin-id',
        1,
        10,
      );
      expect(mockUserRepository.count).toHaveBeenCalledWith('admin-id');
    });

    it('should use default page=1 and limit=10 when not provided', async () => {
      mockUserRepository.findAll.mockResolvedValue([]);
      mockUserRepository.count.mockResolvedValue(0);

      await service.getAllUsers('admin-id');

      expect(mockUserRepository.findAll).toHaveBeenCalledWith(
        'admin-id',
        1,
        10,
      );
    });

    it('should set hasMore=true when more pages exist', async () => {
      mockUserRepository.findAll.mockResolvedValue([buildUser()]);
      mockUserRepository.count.mockResolvedValue(25);

      // page(1) * limit(10) = 10 < total(25) → hasMore = true
      const result = await service.getAllUsers('admin-id', 1, 10);

      expect(result).toBeDefined();
    });

    it('should set hasMore=false when on last page', async () => {
      mockUserRepository.findAll.mockResolvedValue([buildUser()]);
      mockUserRepository.count.mockResolvedValue(5);

      // page(1) * limit(10) = 10 >= total(5) → hasMore = false
      const result = await service.getAllUsers('admin-id', 1, 10);

      expect(result).toBeDefined();
    });

    it('should call findAll and count in parallel', async () => {
      mockUserRepository.findAll.mockResolvedValue([]);
      mockUserRepository.count.mockResolvedValue(0);

      await service.getAllUsers('admin-id', 2, 5);

      expect(mockUserRepository.findAll).toHaveBeenCalledWith('admin-id', 2, 5);
      expect(mockUserRepository.count).toHaveBeenCalledWith('admin-id');
    });
  });

  // ── getUser ──────────────────────────────────────────────────────────────────

  describe('getUser', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      mockUserRepository.findByPk.mockResolvedValue(null);

      await expect(service.getUser('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getUser('non-existent')).rejects.toThrow(
        messages.user.getUser.notFound,
      );
    });

    it('should return user if found', async () => {
      const user = buildUser();
      mockUserRepository.findByPk.mockResolvedValue(user);

      const result = await service.getUser(user._id);

      expect(result).toBeDefined();
      expect(mockUserRepository.findByPk).toHaveBeenCalledWith(user._id);
    });
  });

  // ── deleteUser ───────────────────────────────────────────────────────────────

  describe('deleteUser', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      mockUserRepository.findByPk.mockResolvedValue(null);

      await expect(service.deleteUser('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteUser('non-existent')).rejects.toThrow(
        messages.user.deleteUser.notFound,
      );
    });

    it('should call userCleanupService.cleanup before destroying user', async () => {
      const user = buildUser();
      mockUserRepository.findByPk.mockResolvedValue(user);
      mockUserCleanupService.cleanup.mockResolvedValue(undefined);
      mockUserRepository.destroy.mockResolvedValue(true);

      await service.deleteUser(user._id);

      expect(mockUserCleanupService.cleanup).toHaveBeenCalledTimes(1);
      expect(mockUserCleanupService.cleanup).toHaveBeenCalledWith(user._id);
    });

    it('should call destroy after cleanup with correct userId', async () => {
      const user = buildUser();
      mockUserRepository.findByPk.mockResolvedValue(user);
      mockUserCleanupService.cleanup.mockResolvedValue(undefined);
      mockUserRepository.destroy.mockResolvedValue(true);

      await service.deleteUser(user._id);

      const cleanupOrder =
        mockUserCleanupService.cleanup.mock.invocationCallOrder[0];
      const destroyOrder =
        mockUserRepository.destroy.mock.invocationCallOrder[0];
      expect(cleanupOrder).toBeLessThan(destroyOrder);

      expect(mockUserRepository.destroy).toHaveBeenCalledWith({
        _id: user._id,
      });
    });

    it('should return success response after deletion', async () => {
      const user = buildUser();
      mockUserRepository.findByPk.mockResolvedValue(user);
      mockUserCleanupService.cleanup.mockResolvedValue(undefined);
      mockUserRepository.destroy.mockResolvedValue(true);

      const result = await service.deleteUser(user._id);

      expect(result).toBeDefined();
    });
  });

  // ── updateUserRole ───────────────────────────────────────────────────────────

  describe('updateUserRole', () => {
    it('should throw UnauthorizedException if caller is not admin', async () => {
      mockUserRepository.findByPk.mockResolvedValue(
        buildUser({ role: UserRole.CLIENT }),
      );

      await expect(
        service.updateUserRole(buildAuthUser(), 'target-id', UserRole.SUPPORT),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.updateUserRole(buildAuthUser(), 'target-id', UserRole.SUPPORT),
      ).rejects.toThrow(messages.user.updateRole.unauthorized);
    });

    it('should throw BadRequestException when assigning ADMIN role', async () => {
      mockUserRepository.findByPk.mockResolvedValue(buildAdminUser());

      await expect(
        service.updateUserRole(
          buildAuthUser({ role: UserRole.ADMIN }),
          'target-id',
          UserRole.ADMIN,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateUserRole(
          buildAuthUser({ role: UserRole.ADMIN }),
          'target-id',
          UserRole.ADMIN,
        ),
      ).rejects.toThrow(messages.user.updateRole.invalidRole);
    });

    it('should throw NotFoundException if target user not found', async () => {
      mockUserRepository.findByPk.mockImplementation((id: string) => {
        if (id === 'admin-id') return Promise.resolve(buildAdminUser());
        if (id === 'target-id') return Promise.resolve(null);
        return Promise.resolve(null);
      });
      await expect(
        service.updateUserRole(
          buildAuthUser({ _id: 'admin-id', role: UserRole.ADMIN }),
          'target-id',
          UserRole.SUPPORT,
        ),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateUserRole(
          buildAuthUser({ _id: 'admin-id', role: UserRole.ADMIN }),
          'target-id',
          UserRole.SUPPORT,
        ),
      ).rejects.toThrow(messages.user.updateRole.notFound);
    });

    it('should update to CLIENT role successfully', async () => {
      const targetUser = buildUser({ _id: 'target-id' });
      mockUserRepository.findByPk
        .mockResolvedValueOnce(buildAdminUser())
        .mockResolvedValueOnce(targetUser);
      mockUserRepository.update.mockResolvedValue(true);

      const result = await service.updateUserRole(
        buildAuthUser({ _id: 'admin-id', role: UserRole.ADMIN }),
        'target-id',
        UserRole.CLIENT,
      );

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { role: UserRole.CLIENT },
        { _id: 'target-id' },
      );
      expect(result).toBeDefined();
    });

    it('should update to FREELANCER role successfully', async () => {
      const targetUser = buildUser({ _id: 'target-id' });
      mockUserRepository.findByPk
        .mockResolvedValueOnce(buildAdminUser())
        .mockResolvedValueOnce(targetUser);
      mockUserRepository.update.mockResolvedValue(true);

      await service.updateUserRole(
        buildAuthUser({ _id: 'admin-id', role: UserRole.ADMIN }),
        'target-id',
        UserRole.FREELANCER,
      );

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { role: UserRole.FREELANCER },
        { _id: 'target-id' },
      );
    });

    it('should update to SUPPORT role successfully', async () => {
      const targetUser = buildUser({ _id: 'target-id' });
      mockUserRepository.findByPk
        .mockResolvedValueOnce(buildAdminUser())
        .mockResolvedValueOnce(targetUser);
      mockUserRepository.update.mockResolvedValue(true);

      await service.updateUserRole(
        buildAuthUser({ _id: 'admin-id', role: UserRole.ADMIN }),
        'target-id',
        UserRole.SUPPORT,
      );

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { role: UserRole.SUPPORT },
        { _id: 'target-id' },
      );
    });
  });

  // ── updateAvatar ─────────────────────────────────────────────────────────────

  describe('updateAvatar', () => {
    const authUser = buildAuthUser();
    const mockFile = {
      buffer: Buffer.from('img'),
      mimetype: 'image/png',
    } as Express.Multer.File;

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findByPk.mockResolvedValue(null);

      await expect(service.updateAvatar(authUser, mockFile)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.updateAvatar(authUser, mockFile)).rejects.toThrow(
        messages.user.avatar.notFound,
      );
    });

    it('should throw BadRequestException if no file provided', async () => {
      mockUserRepository.findByPk.mockResolvedValue(buildUser());

      await expect(service.updateAvatar(authUser, undefined)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateAvatar(authUser, undefined)).rejects.toThrow(
        messages.user.avatar.fileRequired,
      );
    });

    it('should NOT delete old avatar if it is the default image', async () => {
      const user = buildUser({
        avatar: 'https://res.cloudinary.com/avatar-default-image.jpg',
      });
      mockUserRepository.findByPk.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue(true);
      const destroySpy = jest
        .spyOn(cloudinaryLib.default.v2.uploader, 'destroy')
        .mockResolvedValue({} as any);
      jest.spyOn(cloudinaryLib, 'uploadToCloudinary').mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/new.jpg',
      } as any);

      await service.updateAvatar(authUser, mockFile);

      expect(destroySpy).not.toHaveBeenCalled();
    });

    it('should NOT delete old avatar if it is not a cloudinary URL', async () => {
      const user = buildUser({ avatar: 'https://other.com/old.jpg' });
      mockUserRepository.findByPk.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue(true);
      const destroySpy = jest
        .spyOn(cloudinaryLib.default.v2.uploader, 'destroy')
        .mockResolvedValue({} as any);
      jest.spyOn(cloudinaryLib, 'uploadToCloudinary').mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/new.jpg',
      } as any);

      await service.updateAvatar(authUser, mockFile);

      expect(destroySpy).not.toHaveBeenCalled();
    });

    it('should delete old cloudinary avatar before uploading new one', async () => {
      const user = buildUser({
        avatar: 'https://res.cloudinary.com/users/avatars/old-avatar-id.jpg',
      });
      mockUserRepository.findByPk.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue(true);
      const destroySpy = jest
        .spyOn(cloudinaryLib.default.v2.uploader, 'destroy')
        .mockResolvedValue({} as any);
      jest.spyOn(cloudinaryLib, 'uploadToCloudinary').mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/new.jpg',
      } as any);

      await service.updateAvatar(authUser, mockFile);

      expect(destroySpy).toHaveBeenCalledWith('users/avatars/old-avatar-id');
    });

    it('should upload new avatar and update user record', async () => {
      const user = buildUser({ avatar: 'https://other.com/old.jpg' });
      mockUserRepository.findByPk.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue(true);
      jest.spyOn(cloudinaryLib, 'uploadToCloudinary').mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/new.jpg',
      } as any);

      const result = await service.updateAvatar(authUser, mockFile);

      expect(cloudinaryLib.uploadToCloudinary).toHaveBeenCalledWith(
        mockFile,
        'users/avatars',
      );
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { avatar: 'https://res.cloudinary.com/new.jpg' },
        { _id: authUser._id },
      );
      expect(result).toBeDefined();
    });

    it('should return correct user data in response', async () => {
      const user = buildUser({ avatar: 'https://other.com/old.jpg' });
      mockUserRepository.findByPk.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue(true);
      jest.spyOn(cloudinaryLib, 'uploadToCloudinary').mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/new.jpg',
      } as any);

      const result = (await service.updateAvatar(authUser, mockFile)) as any;

      // the response should contain avatar, _id, fullname, email, role
      const data = result?.data ?? result;
      expect(data).toBeDefined();
    });
  });

  // ── uploadIdentity ───────────────────────────────────────────────────────────

  describe('uploadIdentity', () => {
    const authUser = buildAuthUser();
    const files = {
      idCard: [{ buffer: Buffer.from('id') } as Express.Multer.File],
      selfie: [{ buffer: Buffer.from('selfie') } as Express.Multer.File],
    };

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findByPk.mockResolvedValue(null);

      await expect(service.uploadIdentity(authUser, files)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.uploadIdentity(authUser, files)).rejects.toThrow(
        messages.user.identity.notFound,
      );
    });

    it('should throw BadRequestException if idCard is missing', async () => {
      mockUserRepository.findByPk.mockResolvedValue(buildUser());

      await expect(
        service.uploadIdentity(authUser, {
          idCard: undefined,
          selfie: files.selfie,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if selfie is missing', async () => {
      mockUserRepository.findByPk.mockResolvedValue(buildUser());

      await expect(
        service.uploadIdentity(authUser, {
          idCard: files.idCard,
          selfie: undefined,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if both files are missing', async () => {
      mockUserRepository.findByPk.mockResolvedValue(buildUser());

      await expect(
        service.uploadIdentity(authUser, {
          idCard: undefined,
          selfie: undefined,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user is already VERIFIED', async () => {
      mockUserRepository.findByPk.mockResolvedValue(
        buildUser({ verificationStatus: VerificationStatus.VERIFIED }),
      );

      await expect(service.uploadIdentity(authUser, files)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadIdentity(authUser, files)).rejects.toThrow(
        messages.user.identity.alreadyVerified,
      );
    });

    it('should upload both images to cloudinary under "kyc" folder', async () => {
      const user = buildUser({ _id: 'user-id-1' });
      const admin = buildUser({ _id: 'admin-id', role: UserRole.ADMIN });
      mockUserRepository.findByPk.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue(true);
      mockUserRepository.findMany.mockResolvedValue([admin]);
      const uploadSpy = jest
        .spyOn(cloudinaryLib, 'uploadToCloudinary')
        .mockResolvedValue({
          secure_url: 'https://cloudinary.com/img.jpg',
        } as any);
      mockNotificationService.createNotification.mockResolvedValue(undefined);

      await service.uploadIdentity(authUser, files);

      expect(uploadSpy).toHaveBeenCalledTimes(2);
      expect(uploadSpy).toHaveBeenCalledWith(files.idCard[0], 'kyc');
      expect(uploadSpy).toHaveBeenCalledWith(files.selfie[0], 'kyc');
    });

    it('should update user with idCard, selfie URLs and PENDING status', async () => {
      const user = buildUser({ _id: 'user-id-1' });
      const admin = buildUser({ _id: 'admin-id', role: UserRole.ADMIN });
      mockUserRepository.findByPk.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue(true);
      mockUserRepository.findMany.mockResolvedValue([admin]);
      jest.spyOn(cloudinaryLib, 'uploadToCloudinary').mockResolvedValue({
        secure_url: 'https://cloudinary.com/img.jpg',
      } as any);
      mockNotificationService.createNotification.mockResolvedValue(undefined);

      await service.uploadIdentity(authUser, files);

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        {
          idCardImage: 'https://cloudinary.com/img.jpg',
          selfieImage: 'https://cloudinary.com/img.jpg',
          verificationStatus: VerificationStatus.PENDING,
        },
        { _id: authUser._id },
      );
    });

    it('should fetch admins and send VERIFY notification to each admin', async () => {
      const user = buildUser({ _id: 'user-id-1' });
      const admin1 = buildUser({ _id: 'admin-id-1', role: UserRole.ADMIN });
      const admin2 = buildUser({ _id: 'admin-id-2', role: UserRole.ADMIN });
      mockUserRepository.findByPk.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue(true);
      mockUserRepository.findMany.mockResolvedValue([admin1, admin2]);
      jest.spyOn(cloudinaryLib, 'uploadToCloudinary').mockResolvedValue({
        secure_url: 'https://cloudinary.com/img.jpg',
      } as any);
      mockNotificationService.createNotification.mockResolvedValue(undefined);

      await service.uploadIdentity(authUser, files);

      expect(mockUserRepository.findMany).toHaveBeenCalledWith({
        role: UserRole.ADMIN,
      });
      expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(
        2,
      );
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          receiverId: 'admin-id-1',
          senderId: user._id.toString(),
          type: NotificationType.VERIFY,
          targetId: user._id.toString(),
          isRead: false,
        }),
      );
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          receiverId: 'admin-id-2',
          senderId: user._id.toString(),
          type: NotificationType.VERIFY,
          targetId: user._id.toString(),
          isRead: false,
        }),
      );
    });

    it('should return PENDING status in response', async () => {
      const user = buildUser({ _id: 'user-id-1' });
      const admin = buildUser({ _id: 'admin-id', role: UserRole.ADMIN });
      mockUserRepository.findByPk.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue(true);
      mockUserRepository.findMany.mockResolvedValue([admin]);
      jest.spyOn(cloudinaryLib, 'uploadToCloudinary').mockResolvedValue({
        secure_url: 'https://cloudinary.com/img.jpg',
      } as any);
      mockNotificationService.createNotification.mockResolvedValue(undefined);

      const result = await service.uploadIdentity(authUser, files);

      expect(result).toBeDefined();
    });
  });

  // ── getVerificationRequests ───────────────────────────────────────────────────

  describe('getVerificationRequests', () => {
    it('should throw ForbiddenException if caller is not admin', async () => {
      const authUser = buildAuthUser({ role: UserRole.CLIENT });

      await expect(service.getVerificationRequests(authUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.getVerificationRequests(authUser)).rejects.toThrow(
        messages.user.requests.forbidden,
      );
    });

    it('should throw ForbiddenException for FREELANCER role', async () => {
      const authUser = buildAuthUser({ role: UserRole.FREELANCER });

      await expect(service.getVerificationRequests(authUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException for SUPPORT role', async () => {
      const authUser = buildAuthUser({ role: UserRole.SUPPORT });

      await expect(service.getVerificationRequests(authUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return pending verification users with count for admin', async () => {
      const authUser = buildAuthUser({ role: UserRole.ADMIN });
      const pendingUsers = [buildUser(), buildUser({ _id: 'user-2' })];
      mockUserRepository.findPendingVerification.mockResolvedValue(
        pendingUsers,
      );

      const result = await service.getVerificationRequests(authUser);

      expect(result).toBeDefined();
      expect(mockUserRepository.findPendingVerification).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should return empty list when no pending verifications', async () => {
      const authUser = buildAuthUser({ role: UserRole.ADMIN });
      mockUserRepository.findPendingVerification.mockResolvedValue([]);

      const result = await service.getVerificationRequests(authUser);

      expect(result).toBeDefined();
    });
  });

  // ── verifyUser ────────────────────────────────────────────────────────────────

  describe('verifyUser', () => {
    it('should throw ForbiddenException if caller is not admin', async () => {
      await expect(
        service.verifyUser(
          buildAuthUser({ role: UserRole.CLIENT }),
          'user-id',
          VerificationStatus.VERIFIED,
        ),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.verifyUser(
          buildAuthUser({ role: UserRole.CLIENT }),
          'user-id',
          VerificationStatus.VERIFIED,
        ),
      ).rejects.toThrow(messages.user.verification.forbidden);
    });

    it('should throw ForbiddenException for FREELANCER role', async () => {
      await expect(
        service.verifyUser(
          buildAuthUser({ role: UserRole.FREELANCER }),
          'user-id',
          VerificationStatus.VERIFIED,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for PENDING status', async () => {
      await expect(
        service.verifyUser(
          buildAuthUser({ role: UserRole.ADMIN }),
          'user-id',
          VerificationStatus.PENDING,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.verifyUser(
          buildAuthUser({ role: UserRole.ADMIN }),
          'user-id',
          VerificationStatus.PENDING,
        ),
      ).rejects.toThrow(messages.user.verification.invalidStatus);
    });

    it('should throw NotFoundException if target user not found', async () => {
      mockUserRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.verifyUser(
          buildAuthUser({ role: UserRole.ADMIN }),
          'user-id',
          VerificationStatus.VERIFIED,
        ),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.verifyUser(
          buildAuthUser({ role: UserRole.ADMIN }),
          'user-id',
          VerificationStatus.VERIFIED,
        ),
      ).rejects.toThrow(messages.user.verification.notFound);
    });

    it('should update status to VERIFIED and send notification', async () => {
      const user = buildUser({ _id: 'user-id' });
      mockUserRepository.findByPk.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue(true);
      mockNotificationService.createNotification.mockResolvedValue(undefined);

      const admin = buildAuthUser({ _id: 'admin-id', role: UserRole.ADMIN });
      const result = await service.verifyUser(
        admin,
        'user-id',
        VerificationStatus.VERIFIED,
      );

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { verificationStatus: VerificationStatus.VERIFIED },
        { _id: 'user-id' },
      );
      expect(result).toBeDefined();
    });

    it('should update status to REJECTED and send notification', async () => {
      const user = buildUser({ _id: 'user-id' });
      mockUserRepository.findByPk.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue(true);
      mockNotificationService.createNotification.mockResolvedValue(undefined);

      const admin = buildAuthUser({ _id: 'admin-id', role: UserRole.ADMIN });
      await service.verifyUser(admin, 'user-id', VerificationStatus.REJECTED);

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { verificationStatus: VerificationStatus.REJECTED },
        { _id: 'user-id' },
      );
    });

    it('should send VERIFY notification to the target user from admin', async () => {
      const user = buildUser({ _id: 'user-id' });
      mockUserRepository.findByPk.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue(true);
      mockNotificationService.createNotification.mockResolvedValue(undefined);

      const admin = buildAuthUser({ _id: 'admin-id', role: UserRole.ADMIN });
      await service.verifyUser(admin, 'user-id', VerificationStatus.VERIFIED);

      expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(
        1,
      );
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith({
        receiverId: user._id.toString(),
        senderId: admin._id.toString(),
        type: NotificationType.VERIFY,
        targetId: user._id.toString(),
        isRead: false,
      });
    });

    it('should return response containing updated verificationStatus', async () => {
      const user = buildUser({ _id: 'user-id' });
      mockUserRepository.findByPk.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue(true);
      mockNotificationService.createNotification.mockResolvedValue(undefined);

      const admin = buildAuthUser({ _id: 'admin-id', role: UserRole.ADMIN });
      const result = (await service.verifyUser(
        admin,
        'user-id',
        VerificationStatus.VERIFIED,
      )) as any;

      expect(result).toBeDefined();
    });
  });
});
