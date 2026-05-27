import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from 'src/enums/user.enum';
import { NotificationType } from 'src/enums/notification.enum';
import * as cloudinaryLib from 'src/libs/cloudinary';
import { MessageService } from 'src/services/message.service';
import { NotificationService } from 'src/services/notification.service';
import { RedisHelper } from 'src/redis/redis.helper';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockMessageRepository = {
  findById: jest.fn(),
  findChatMessages: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn(),
  markAsRead: jest.fn(),
};

const mockContractRepository = {
  findByPk: jest.fn(),
};

const mockNotificationService = {
  createNotification: jest.fn(),
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

const buildContract = (overrides = {}) => ({
  _id: 'contract-id-1',
  clientId: 'client-id-1',
  freelancerId: 'freelancer-id-1',
  ...overrides,
});

const buildMessage = (overrides = {}) => ({
  _id: { toString: () => 'message-id-1' },
  senderId: 'client-id-1',
  receiverId: 'freelancer-id-1',
  contractId: { toString: () => 'contract-id-1' },
  content: 'Hello!',
  image: '',
  isRead: false,
  ...overrides,
});

const buildAuthUser = (overrides: any = {}) => ({
  _id: 'client-id-1',
  role: UserRole.CLIENT,
  ...overrides,
});

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('MessageService', () => {
  let service: MessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        { provide: 'IMessageRepository', useValue: mockMessageRepository },
        { provide: 'IContractRepository', useValue: mockContractRepository },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: RedisHelper, useValue: mockRedisHelper },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
    jest.clearAllMocks();
    // Reset redis mock defaults after clearAllMocks
    mockRedisHelper.get.mockResolvedValue(null);
    mockRedisHelper.set.mockResolvedValue(undefined);
    mockRedisHelper.del.mockResolvedValue(undefined);
    mockRedisHelper.lrange.mockResolvedValue([]);
    mockRedisHelper.lpush.mockResolvedValue(undefined);
    mockRedisHelper.ltrim.mockResolvedValue(undefined);
  });

  // ── sendMessage ───────────────────────────────────────────────────────────────

  describe('sendMessage', () => {
    const dto = { receiverId: 'freelancer-id-1', content: 'Hello!' };

    it('should throw NotFoundException if contract not found', async () => {
      mockContractRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.sendMessage('client-id-1', 'contract-id', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if sender is not part of the contract', async () => {
      mockContractRepository.findByPk.mockResolvedValue(buildContract());

      await expect(
        service.sendMessage('random-user', 'contract-id', dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if no content and no file', async () => {
      mockContractRepository.findByPk.mockResolvedValue(buildContract());

      await expect(
        service.sendMessage('client-id-1', 'contract-id', {
          receiverId: 'freelancer-id-1',
          content: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create message with text content and send notification', async () => {
      const message = buildMessage();
      mockContractRepository.findByPk.mockResolvedValue(buildContract());
      mockMessageRepository.create.mockResolvedValue(message);
      mockNotificationService.createNotification.mockResolvedValue(undefined);

      const result = await service.sendMessage(
        'client-id-1',
        'contract-id',
        dto,
      );

      expect(mockMessageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Hello!', senderId: 'client-id-1' }),
      );
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.MESSAGE }),
      );
      expect(mockRedisHelper.lpush).toHaveBeenCalled();
      expect(mockRedisHelper.ltrim).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should upload file and attach image URL to message', async () => {
      const message = buildMessage({ image: 'https://cloudinary.com/img.jpg' });
      const file = {
        buffer: Buffer.from('img'),
        mimetype: 'image/png',
      } as Express.Multer.File;
      mockContractRepository.findByPk.mockResolvedValue(buildContract());
      mockMessageRepository.create.mockResolvedValue(message);
      mockNotificationService.createNotification.mockResolvedValue(undefined);
      jest.spyOn(cloudinaryLib, 'uploadToCloudinary').mockResolvedValue({
        secure_url: 'https://cloudinary.com/img.jpg',
      } as any);

      const result = await service.sendMessage(
        'client-id-1',
        'contract-id',
        dto,
        file,
      );

      expect(cloudinaryLib.uploadToCloudinary).toHaveBeenCalledWith(
        file,
        'messages',
      );
      expect(result).toBeDefined();
    });
  });

  // ── getChatMessages ───────────────────────────────────────────────────────────

  describe('getChatMessages', () => {
    it('should throw NotFoundException if contract not found', async () => {
      mockContractRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.getChatMessages(
          'client-id-1',
          'contract-id',
          'freelancer-id-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not part of the contract', async () => {
      mockContractRepository.findByPk.mockResolvedValue(buildContract());

      await expect(
        service.getChatMessages('random-user', 'contract-id', 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return cached messages from redis if available', async () => {
      const cachedMessages = [buildMessage()];
      mockContractRepository.findByPk.mockResolvedValue(buildContract());
      mockRedisHelper.lrange.mockResolvedValue(
        cachedMessages.map((m) => JSON.stringify(m)),
      );

      const result = await service.getChatMessages(
        'client-id-1',
        'contract-id-1',
        'freelancer-id-1',
      );

      expect(result).toBeDefined();
      expect(mockMessageRepository.findChatMessages).not.toHaveBeenCalled();
    });

    it('should return chat messages from DB and cache them', async () => {
      const msgs = [buildMessage()];
      mockContractRepository.findByPk.mockResolvedValue(buildContract());
      mockRedisHelper.lrange.mockResolvedValue([]);
      mockMessageRepository.findChatMessages.mockResolvedValue(msgs);

      const result = await service.getChatMessages(
        'client-id-1',
        'contract-id-1',
        'freelancer-id-1',
      );

      expect(mockMessageRepository.findChatMessages).toHaveBeenCalledWith(
        'contract-id-1',
        'client-id-1',
        'freelancer-id-1',
      );
      expect(mockRedisHelper.lpush).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // ── deleteMessage ─────────────────────────────────────────────────────────────

  describe('deleteMessage', () => {
    it('should throw NotFoundException if message not found', async () => {
      mockMessageRepository.findById.mockResolvedValue(null);

      await expect(
        service.deleteMessage(buildAuthUser(), 'message-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if caller is not the sender', async () => {
      mockMessageRepository.findById.mockResolvedValue(
        buildMessage({ senderId: 'other-user' }),
      );

      await expect(
        service.deleteMessage(
          buildAuthUser({ _id: 'wrong-user' }),
          'message-id',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should delete message if sender and clear redis cache', async () => {
      const message = buildMessage();
      mockMessageRepository.findById.mockResolvedValue(message);
      mockMessageRepository.destroy.mockResolvedValue(true);

      const result = await service.deleteMessage(buildAuthUser(), 'message-id');

      expect(mockMessageRepository.destroy).toHaveBeenCalledWith({
        _id: message._id,
      });
      expect(mockRedisHelper.del).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // ── markMessageAsRead ─────────────────────────────────────────────────────────

  describe('markMessageAsRead', () => {
    it('should throw NotFoundException if contract not found', async () => {
      mockContractRepository.findByPk.mockResolvedValue(null);

      await expect(
        service.markMessageAsRead(
          'client-id-1',
          'freelancer-id-1',
          'contract-id',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not part of the contract', async () => {
      mockContractRepository.findByPk.mockResolvedValue(buildContract());

      await expect(
        service.markMessageAsRead('random-user', 'other-user', 'contract-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should mark messages as read and return modified count', async () => {
      mockContractRepository.findByPk.mockResolvedValue(buildContract());
      mockMessageRepository.markAsRead.mockResolvedValue(3);

      const result = await service.markMessageAsRead(
        'client-id-1',
        'freelancer-id-1',
        'contract-id-1',
      );

      expect(mockMessageRepository.markAsRead).toHaveBeenCalledWith(
        'freelancer-id-1',
        'client-id-1',
        'contract-id-1',
      );
      expect(mockRedisHelper.del).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should update redis unread count when messages were marked as read', async () => {
      mockContractRepository.findByPk.mockResolvedValue(buildContract());
      mockMessageRepository.markAsRead.mockResolvedValue(3);
      mockRedisHelper.get.mockResolvedValue('5');

      const result = await service.markMessageAsRead(
        'client-id-1',
        'freelancer-id-1',
        'contract-id-1',
      );

      expect(mockRedisHelper.get).toHaveBeenCalledWith(
        expect.stringContaining('unread_count:'),
      );
      expect(mockRedisHelper.set).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
