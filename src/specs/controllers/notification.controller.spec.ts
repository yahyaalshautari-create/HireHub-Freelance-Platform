import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from 'src/services/notification.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import type { RequestWithUser } from 'src/types/express';
import { NotificationController } from 'src/controllers/notification.controller';

describe('NotificationController', () => {
  let controller: NotificationController;
  let notificationService: jest.Mocked<NotificationService>;

  const mockNotificationService: jest.Mocked<Partial<any>> = {
    getUserNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
  };

  const mockUser = { _id: 'user-id-123', email: 'user@example.com' };
  const mockRequest = { user: mockUser } as unknown as RequestWithUser;
  const notificationId = 'notif-id-abc';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideInterceptor(ResponseInterceptor)
      .useValue({ intercept: jest.fn((ctx, next) => next.handle()) })
      .compile();

    controller = module.get<NotificationController>(NotificationController);
    notificationService = module.get(NotificationService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── getMyNotifications ───────────────────────────────────────────────────
  describe('getMyNotifications()', () => {
    it('should call notificationService.getUserNotifications with user._id', async () => {
      const expectedResult = [{ _id: notificationId, read: false }];
      mockNotificationService.getUserNotifications.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.getMyNotifications(mockRequest);

      expect(notificationService.getUserNotifications).toHaveBeenCalledTimes(1);
      expect(notificationService.getUserNotifications).toHaveBeenCalledWith(
        mockUser._id,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from getUserNotifications', async () => {
      mockNotificationService.getUserNotifications.mockRejectedValue(
        new Error('Fetch failed'),
      );

      await expect(controller.getMyNotifications(mockRequest)).rejects.toThrow(
        'Fetch failed',
      );
    });
  });

  // ─── getUnreadCount ───────────────────────────────────────────────────────
  describe('getUnreadCount()', () => {
    it('should call notificationService.getUnreadCount with user._id and return count', async () => {
      const expectedResult = { count: 5 };
      mockNotificationService.getUnreadCount.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.getUnreadCount(mockRequest);

      expect(notificationService.getUnreadCount).toHaveBeenCalledTimes(1);
      expect(notificationService.getUnreadCount).toHaveBeenCalledWith(
        mockUser._id,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from getUnreadCount', async () => {
      mockNotificationService.getUnreadCount.mockRejectedValue(
        new Error('Count failed'),
      );

      await expect(controller.getUnreadCount(mockRequest)).rejects.toThrow(
        'Count failed',
      );
    });
  });

  // ─── markAsRead ───────────────────────────────────────────────────────────
  describe('markAsRead()', () => {
    it('should call notificationService.markAsRead with notification id', async () => {
      const expectedResult = { _id: notificationId, read: true };
      mockNotificationService.markAsRead.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.markAsRead(notificationId);

      expect(notificationService.markAsRead).toHaveBeenCalledTimes(1);
      expect(notificationService.markAsRead).toHaveBeenCalledWith(
        notificationId,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from markAsRead', async () => {
      mockNotificationService.markAsRead.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(controller.markAsRead(notificationId)).rejects.toThrow(
        'Not found',
      );
    });
  });

  // ─── markAllAsRead ────────────────────────────────────────────────────────
  describe('markAllAsRead()', () => {
    it('should call notificationService.markAllAsRead with user._id', async () => {
      const expectedResult = { updated: 3 };
      mockNotificationService.markAllAsRead.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.markAllAsRead(mockRequest);

      expect(notificationService.markAllAsRead).toHaveBeenCalledTimes(1);
      expect(notificationService.markAllAsRead).toHaveBeenCalledWith(
        mockUser._id,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from markAllAsRead', async () => {
      mockNotificationService.markAllAsRead.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(controller.markAllAsRead(mockRequest)).rejects.toThrow(
        'Update failed',
      );
    });
  });

  // ─── deleteNotification ───────────────────────────────────────────────────
  describe('deleteNotification()', () => {
    it('should call notificationService.deleteNotification with notification id', async () => {
      const expectedResult = { message: 'Notification deleted' };
      mockNotificationService.deleteNotification.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.deleteNotification(notificationId);

      expect(notificationService.deleteNotification).toHaveBeenCalledTimes(1);
      expect(notificationService.deleteNotification).toHaveBeenCalledWith(
        notificationId,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from deleteNotification', async () => {
      mockNotificationService.deleteNotification.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(
        controller.deleteNotification(notificationId),
      ).rejects.toThrow('Delete failed');
    });
  });
});
