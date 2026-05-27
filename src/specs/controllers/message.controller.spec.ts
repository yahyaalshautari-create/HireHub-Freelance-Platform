import { Test, TestingModule } from '@nestjs/testing';
import { MessageService } from 'src/services/message.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { ResponseInterceptor } from 'src/response.interceptor';
import { SendMessageDto } from 'src/dtos/message/send-message.dto';
import type { RequestWithUser } from 'src/types/express';
import { MessageController } from 'src/controllers/message.controller';

describe('MessageController', () => {
  let controller: MessageController;
  let messageService: jest.Mocked<MessageService>;

  const mockMessageService: jest.Mocked<Partial<any>> = {
    sendMessage: jest.fn(),
    getChatMessages: jest.fn(),
    deleteMessage: jest.fn(),
    markMessageAsRead: jest.fn(),
  };

  const mockUser = { _id: 'user-id-123', email: 'user@example.com' };
  const mockRequest = { user: mockUser } as unknown as RequestWithUser;
  const contractId = 'contract-id-abc';
  const otherUserId = 'other-user-id-456';
  const messageId = 'message-id-789';
  const senderId = 'sender-id-111';

  const mockFile = {
    fieldname: 'image',
    originalname: 'photo.jpg',
    mimetype: 'image/jpeg',
    size: 2048,
    buffer: Buffer.from(''),
  } as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessageController],
      providers: [{ provide: MessageService, useValue: mockMessageService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideInterceptor(ResponseInterceptor)
      .useValue({ intercept: jest.fn((ctx, next) => next.handle()) })
      .compile();

    controller = module.get<MessageController>(MessageController);
    messageService = module.get(MessageService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── sendMessage ──────────────────────────────────────────────────────────
  describe('sendMessage()', () => {
    const sendMessageDto: SendMessageDto = {
      content: 'Hello!',
    } as SendMessageDto;

    it('should call messageService.sendMessage with correct args', async () => {
      const expectedResult = { _id: messageId };
      mockMessageService.sendMessage.mockResolvedValue(expectedResult as any);

      const result = await controller.sendMessage(
        mockRequest,
        contractId,
        sendMessageDto,
        mockFile,
      );

      expect(messageService.sendMessage).toHaveBeenCalledTimes(1);
      expect(messageService.sendMessage).toHaveBeenCalledWith(
        mockUser._id,
        contractId,
        sendMessageDto,
        mockFile,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should work when no file is provided', async () => {
      mockMessageService.sendMessage.mockResolvedValue({
        _id: messageId,
      } as any);

      await controller.sendMessage(
        mockRequest,
        contractId,
        sendMessageDto,
        undefined as any,
      );

      expect(messageService.sendMessage).toHaveBeenCalledWith(
        mockUser._id,
        contractId,
        sendMessageDto,
        undefined,
      );
    });

    it('should propagate errors from sendMessage', async () => {
      mockMessageService.sendMessage.mockRejectedValue(
        new Error('Send failed'),
      );

      await expect(
        controller.sendMessage(
          mockRequest,
          contractId,
          sendMessageDto,
          mockFile,
        ),
      ).rejects.toThrow('Send failed');
    });
  });

  // ─── getChatMessages ──────────────────────────────────────────────────────
  describe('getChatMessages()', () => {
    it('should call messageService.getChatMessages with correct args', async () => {
      const expectedResult = [{ _id: messageId, content: 'Hello!' }];
      mockMessageService.getChatMessages.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.getChatMessages(
        mockRequest,
        contractId,
        otherUserId,
      );

      expect(messageService.getChatMessages).toHaveBeenCalledTimes(1);
      expect(messageService.getChatMessages).toHaveBeenCalledWith(
        mockUser._id,
        contractId,
        otherUserId,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from getChatMessages', async () => {
      mockMessageService.getChatMessages.mockRejectedValue(
        new Error('Fetch failed'),
      );

      await expect(
        controller.getChatMessages(mockRequest, contractId, otherUserId),
      ).rejects.toThrow('Fetch failed');
    });
  });

  // ─── deleteMessage ────────────────────────────────────────────────────────
  describe('deleteMessage()', () => {
    it('should call messageService.deleteMessage with user and messageId', async () => {
      const expectedResult = { message: 'Deleted' };
      mockMessageService.deleteMessage.mockResolvedValue(expectedResult as any);

      const result = await controller.deleteMessage(mockRequest, messageId);

      expect(messageService.deleteMessage).toHaveBeenCalledTimes(1);
      expect(messageService.deleteMessage).toHaveBeenCalledWith(
        mockUser,
        messageId,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from deleteMessage', async () => {
      mockMessageService.deleteMessage.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(
        controller.deleteMessage(mockRequest, messageId),
      ).rejects.toThrow('Delete failed');
    });
  });

  // ─── markMessageAsRead ────────────────────────────────────────────────────
  describe('markMessageAsRead()', () => {
    it('should call messageService.markMessageAsRead with correct args', async () => {
      const expectedResult = { updated: true };
      mockMessageService.markMessageAsRead.mockResolvedValue(
        expectedResult as any,
      );

      const result = await controller.markMessageAsRead(
        mockRequest,
        senderId,
        contractId,
      );

      expect(messageService.markMessageAsRead).toHaveBeenCalledTimes(1);
      expect(messageService.markMessageAsRead).toHaveBeenCalledWith(
        mockUser._id,
        senderId,
        contractId,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from markMessageAsRead', async () => {
      mockMessageService.markMessageAsRead.mockRejectedValue(
        new Error('Mark failed'),
      );

      await expect(
        controller.markMessageAsRead(mockRequest, senderId, contractId),
      ).rejects.toThrow('Mark failed');
    });
  });
});
