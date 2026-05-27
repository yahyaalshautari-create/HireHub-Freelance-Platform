import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from 'src/services/user.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { AdminGuard } from 'src/guards/admin.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import { UserRole, VerificationStatus } from 'src/enums/user.enum';
import type { RequestWithUser } from 'src/types/express';
import { UserController } from 'src/controllers/user.controller';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  const mockUserService: jest.Mocked<Partial<any>> = {
    getAllUsers: jest.fn(),
    getUser: jest.fn(),
    deleteUser: jest.fn(),
    updateUserRole: jest.fn(),
    updateAvatar: jest.fn(),
    uploadIdentity: jest.fn(),
    getVerificationRequests: jest.fn(),
    verifyUser: jest.fn(),
  };

  const mockUser = {
    _id: 'user-id-123',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };
  const mockRequest = { user: mockUser } as unknown as RequestWithUser;
  const userId = 'target-user-id-456';

  const mockFile = {
    fieldname: 'avatar',
    originalname: 'avatar.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from(''),
  } as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideInterceptor(ResponseInterceptor)
      .useValue({ intercept: jest.fn((ctx, next) => next.handle()) })
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── getAllUsers ──────────────────────────────────────────────────────────
  describe('getAllUsers()', () => {
    it('should call userService.getAllUsers with user._id, page=1 and limit=10 by default', async () => {
      const expectedResult = { data: [], total: 0 };
      mockUserService.getAllUsers.mockResolvedValue(expectedResult as any);

      const result = await controller.getAllUsers(
        mockRequest,
        undefined as any,
        undefined as any,
      );

      expect(userService.getAllUsers).toHaveBeenCalledWith(mockUser._id, 1, 10);
      expect(result).toEqual(expectedResult);
    });

    it('should parse string page and limit to numbers', async () => {
      mockUserService.getAllUsers.mockResolvedValue({ data: [] } as any);

      await controller.getAllUsers(mockRequest, '3', '15');

      expect(userService.getAllUsers).toHaveBeenCalledWith(mockUser._id, 3, 15);
    });

    it('should propagate errors from getAllUsers', async () => {
      mockUserService.getAllUsers.mockRejectedValue(new Error('Fetch failed'));

      await expect(
        controller.getAllUsers(mockRequest, '1', '10'),
      ).rejects.toThrow('Fetch failed');
    });
  });

  // ─── getUser ──────────────────────────────────────────────────────────────
  describe('getUser()', () => {
    it('should call userService.getUser with id and return result', async () => {
      const expectedResult = { _id: userId, email: 'user@example.com' };
      mockUserService.getUser.mockResolvedValue(expectedResult as any);

      const result = await controller.getUser(userId);

      expect(userService.getUser).toHaveBeenCalledTimes(1);
      expect(userService.getUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from getUser', async () => {
      mockUserService.getUser.mockRejectedValue(new Error('User not found'));

      await expect(controller.getUser(userId)).rejects.toThrow(
        'User not found',
      );
    });
  });

  // ─── deleteUser ───────────────────────────────────────────────────────────
  describe('deleteUser()', () => {
    it('should call userService.deleteUser with id', async () => {
      const expectedResult = { message: 'User deleted' };
      mockUserService.deleteUser.mockResolvedValue(expectedResult as any);

      const result = await controller.deleteUser(userId);

      expect(userService.deleteUser).toHaveBeenCalledTimes(1);
      expect(userService.deleteUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from deleteUser', async () => {
      mockUserService.deleteUser.mockRejectedValue(new Error('Delete failed'));

      await expect(controller.deleteUser(userId)).rejects.toThrow(
        'Delete failed',
      );
    });
  });

  // ─── updateUserRole ───────────────────────────────────────────────────────
  describe('updateUserRole()', () => {
    it('should call userService.updateUserRole with user, id and role', async () => {
      const role = UserRole.FREELANCER;
      const expectedResult = { _id: userId, role };
      mockUserService.updateUserRole.mockResolvedValue(expectedResult as any);

      const result = await controller.updateUserRole(mockRequest, userId, role);

      expect(userService.updateUserRole).toHaveBeenCalledTimes(1);
      expect(userService.updateUserRole).toHaveBeenCalledWith(
        mockUser,
        userId,
        role,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from updateUserRole', async () => {
      mockUserService.updateUserRole.mockRejectedValue(
        new Error('Role update failed'),
      );

      await expect(
        controller.updateUserRole(mockRequest, userId, UserRole.CLIENT),
      ).rejects.toThrow('Role update failed');
    });
  });

  // ─── updateAvatar ─────────────────────────────────────────────────────────
  describe('updateAvatar()', () => {
    it('should call userService.updateAvatar with user and file', async () => {
      const expectedResult = {
        avatarUrl: 'https://cdn.example.com/avatar.jpg',
      };
      mockUserService.updateAvatar.mockResolvedValue(expectedResult as any);

      const result = await controller.updateAvatar(mockRequest, mockFile);

      expect(userService.updateAvatar).toHaveBeenCalledTimes(1);
      expect(userService.updateAvatar).toHaveBeenCalledWith(mockUser, mockFile);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from updateAvatar', async () => {
      mockUserService.updateAvatar.mockRejectedValue(
        new Error('Upload failed'),
      );

      await expect(
        controller.updateAvatar(mockRequest, mockFile),
      ).rejects.toThrow('Upload failed');
    });
  });

  // ─── uploadIdentity ───────────────────────────────────────────────────────
  describe('uploadIdentity()', () => {
    const mockFiles = {
      idCard: [{ ...mockFile, fieldname: 'idCard' } as Express.Multer.File],
      selfie: [{ ...mockFile, fieldname: 'selfie' } as Express.Multer.File],
    };

    it('should call userService.uploadIdentity with user and files', async () => {
      const expectedResult = { status: 'pending' };
      mockUserService.uploadIdentity.mockResolvedValue(expectedResult as any);

      const result = await controller.uploadIdentity(mockRequest, mockFiles);

      expect(userService.uploadIdentity).toHaveBeenCalledTimes(1);
      expect(userService.uploadIdentity).toHaveBeenCalledWith(
        mockUser,
        mockFiles,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should work with partial files (only idCard)', async () => {
      const partialFiles = { idCard: [mockFile] };
      mockUserService.uploadIdentity.mockResolvedValue({
        status: 'pending',
      } as any);

      await controller.uploadIdentity(mockRequest, partialFiles);

      expect(userService.uploadIdentity).toHaveBeenCalledWith(
        mockUser,
        partialFiles,
      );
    });

    it('should propagate errors from uploadIdentity', async () => {
      mockUserService.uploadIdentity.mockRejectedValue(
        new Error('Upload failed'),
      );

      await expect(
        controller.uploadIdentity(mockRequest, mockFiles),
      ).rejects.toThrow('Upload failed');
    });
  });

  // ─── getVerificationRequests ──────────────────────────────────────────────
  describe('getVerificationRequests()', () => {
    it('should call userService.getVerificationRequests with user', async () => {
      const expectedResult = [{ _id: userId, status: 'pending' }];
      mockUserService.getVerificationRequests.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.getVerificationRequests(mockRequest);

      expect(userService.getVerificationRequests).toHaveBeenCalledTimes(1);
      expect(userService.getVerificationRequests).toHaveBeenCalledWith(
        mockUser,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from getVerificationRequests', async () => {
      mockUserService.getVerificationRequests.mockRejectedValue(
        new Error('Fetch failed'),
      );

      await expect(
        controller.getVerificationRequests(mockRequest),
      ).rejects.toThrow('Fetch failed');
    });
  });

  // ─── verifyUser ───────────────────────────────────────────────────────────
  describe('verifyUser()', () => {
    it('should call userService.verifyUser with user, id and VERIFIED status', async () => {
      const status = VerificationStatus.VERIFIED;
      const expectedResult = { _id: userId, verificationStatus: status };
      mockUserService.verifyUser.mockResolvedValue(expectedResult as any);

      const result = await controller.verifyUser(mockRequest, userId, status);

      expect(userService.verifyUser).toHaveBeenCalledTimes(1);
      expect(userService.verifyUser).toHaveBeenCalledWith(
        mockUser,
        userId,
        status,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should call userService.verifyUser with REJECTED status', async () => {
      const status = VerificationStatus.REJECTED;
      mockUserService.verifyUser.mockResolvedValue({ status } as any);

      await controller.verifyUser(mockRequest, userId, status);

      expect(userService.verifyUser).toHaveBeenCalledWith(
        mockUser,
        userId,
        status,
      );
    });

    it('should propagate errors from verifyUser', async () => {
      mockUserService.verifyUser.mockRejectedValue(
        new Error('Verification failed'),
      );

      await expect(
        controller.verifyUser(mockRequest, userId, VerificationStatus.VERIFIED),
      ).rejects.toThrow('Verification failed');
    });
  });
});
