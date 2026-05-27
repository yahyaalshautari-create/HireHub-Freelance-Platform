import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationType } from 'src/enums/notification.enum';
import { NotificationService } from 'src/services/notification.service';
import { RedisHelper } from 'src/redis/redis.helper';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockNotificationRepository = {
  create: jest.fn(),
  findByUser: jest.fn(),
  findUnreadCount: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  destroy: jest.fn(),
};

const mockRedisHelper = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  lpush: jest.fn().mockResolvedValue(undefined),
  ltrim: jest.fn().mockResolvedValue(undefined),
  lrange: jest.fn().mockResolvedValue([]),
  incr: jest.fn().mockResolvedValue(undefined),
  decr: jest.fn().mockResolvedValue(undefined),
  lrem: jest.fn().mockResolvedValue(undefined),
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const buildNotification = (overrides = {}) => ({
  _id: 'notification-id-1',
  receiverId: 'user-id-2',
  senderId: 'user-id-1',
  type: NotificationType.MESSAGE,
  targetId: 'target-id-1',
  isRead: false,
  ...overrides,
});

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: 'INotificationRepository',
          useValue: mockNotificationRepository,
        },
        { provide: RedisHelper, useValue: mockRedisHelper },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    jest.clearAllMocks();
    // Reset redis mock defaults after clearAllMocks
    mockRedisHelper.get.mockResolvedValue(null);
    mockRedisHelper.set.mockResolvedValue(undefined);
    mockRedisHelper.incr.mockResolvedValue(undefined);
    mockRedisHelper.decr.mockResolvedValue(undefined);
    mockRedisHelper.lpush.mockResolvedValue(undefined);
    mockRedisHelper.ltrim.mockResolvedValue(undefined);
    mockRedisHelper.lrem.mockResolvedValue(undefined);
  });

  // ── createNotification ────────────────────────────────────────────────────────

  describe('createNotification', () => {
    it('should do nothing if sender and receiver are the same', async () => {
      await service.createNotification(
        buildNotification({ receiverId: 'same-id', senderId: 'same-id' }),
      );

      expect(mockNotificationRepository.create).not.toHaveBeenCalled();
    });

    it('should create notification and update redis cache', async () => {
      const notification = buildNotification();
      mockNotificationRepository.create.mockResolvedValue(notification);

      await service.createNotification(notification);

      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          receiverId: 'user-id-2',
          senderId: 'user-id-1',
          isRead: false,
        }),
      );
      expect(mockRedisHelper.incr).toHaveBeenCalledWith(
        'unread_count:user-id-2',
      );
      expect(mockRedisHelper.lpush).toHaveBeenCalledWith(
        'notifications:user-id-2',
        notification,
      );
      expect(mockRedisHelper.ltrim).toHaveBeenCalledWith(
        'notifications:user-id-2',
        0,
        19,
      );
    });
  });

  // ── getUserNotifications ──────────────────────────────────────────────────────

  describe('getUserNotifications', () => {
    it('should return notifications for a user', async () => {
      const notifications = [
        buildNotification(),
        buildNotification({ _id: 'notif-2' }),
      ];
      mockNotificationRepository.findByUser.mockResolvedValue(notifications);

      const result = await service.getUserNotifications('user-id-2');

      expect(mockNotificationRepository.findByUser).toHaveBeenCalledWith(
        'user-id-2',
      );
      expect(result).toBeDefined();
    });
  });

  // ── getUnreadCount ────────────────────────────────────────────────────────────

  describe('getUnreadCount', () => {
    it('should return cached count from redis if available', async () => {
      mockRedisHelper.get.mockResolvedValue('5');

      const result = await service.getUnreadCount('user-id-1');

      expect(mockRedisHelper.get).toHaveBeenCalledWith(
        'unread_count:user-id-1',
      );
      expect(mockNotificationRepository.findUnreadCount).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should query DB and cache result if redis returns null', async () => {
      mockRedisHelper.get.mockResolvedValue(null);
      mockNotificationRepository.findUnreadCount.mockResolvedValue(3);

      const result = await service.getUnreadCount('user-id-1');

      expect(mockNotificationRepository.findUnreadCount).toHaveBeenCalledWith(
        'user-id-1',
      );
      expect(mockRedisHelper.set).toHaveBeenCalledWith(
        'unread_count:user-id-1',
        3,
      );
      expect(result).toBeDefined();
    });
  });

  // ── markAsRead ────────────────────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('should mark notification as read and decrement redis counter', async () => {
      const notification = buildNotification();
      mockNotificationRepository.markAsRead.mockResolvedValue(notification);

      const result = await service.markAsRead('notification-id-1');

      expect(mockNotificationRepository.markAsRead).toHaveBeenCalledWith(
        'notification-id-1',
      );
      expect(mockRedisHelper.decr).toHaveBeenCalledWith(
        'unread_count:user-id-2',
      );
      expect(result).toBeDefined();
    });

    it('should not decrement redis if notification not found', async () => {
      mockNotificationRepository.markAsRead.mockResolvedValue(null);

      const result = await service.markAsRead('non-existent');

      expect(mockRedisHelper.decr).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // ── markAllAsRead ─────────────────────────────────────────────────────────────

  describe('markAllAsRead', () => {
    it('should mark all notifications as read and reset redis counter to 0', async () => {
      mockNotificationRepository.markAllAsRead.mockResolvedValue(true);

      const result = await service.markAllAsRead('user-id-1');

      expect(mockNotificationRepository.markAllAsRead).toHaveBeenCalledWith(
        'user-id-1',
      );
      expect(mockRedisHelper.set).toHaveBeenCalledWith(
        'unread_count:user-id-1',
        0,
      );
      expect(result).toBeDefined();
    });
  });

  // ── deleteNotification ────────────────────────────────────────────────────────

  describe('deleteNotification', () => {
    it('should throw NotFoundException if notification not found', async () => {
      mockNotificationRepository.destroy.mockResolvedValue(null);

      await expect(service.deleteNotification('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete notification and update redis (unread → decrement)', async () => {
      const notification = buildNotification({ isRead: false });
      mockNotificationRepository.destroy.mockResolvedValue(notification);

      const result = await service.deleteNotification('notification-id-1');

      expect(mockRedisHelper.lrem).toHaveBeenCalledWith(
        'notifications:user-id-2',
        'notification-id-1',
      );
      expect(mockRedisHelper.decr).toHaveBeenCalledWith(
        'unread_count:user-id-2',
      );
      expect(result).toBeDefined();
    });

    it('should delete read notification without decrementing counter', async () => {
      const notification = buildNotification({ isRead: true });
      mockNotificationRepository.destroy.mockResolvedValue(notification);

      const result = await service.deleteNotification('notification-id-1');

      expect(mockRedisHelper.lrem).toHaveBeenCalled();
      expect(mockRedisHelper.decr).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
