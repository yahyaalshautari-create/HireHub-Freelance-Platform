import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SendMessageDto } from 'src/dtos/message/send-message.dto';
import { AuthUser } from 'src/interfaces/auth-user.interface';
import type { IContractRepository } from 'src/interfaces/contract.interface';
import type { IMessageRepository } from 'src/interfaces/message.interface';
import { uploadToCloudinary } from 'src/libs/cloudinary';
import { assertOwnerOrAdmin, response } from 'src/libs/helpers';
import { messages } from 'src/libs/messages';
import { NotificationService } from './notification.service';
import { NotificationType } from 'src/enums/notification.enum';
import { RedisHelper } from 'src/redis/redis.helper';

@Injectable()
export class MessageService {
  constructor(
    @Inject('IMessageRepository')
    private readonly messageRepository: IMessageRepository,

    @Inject('IContractRepository')
    private readonly contractRepository: IContractRepository,
    private readonly notificationService: NotificationService,
    private readonly redisHelper: RedisHelper,
  ) {}

  async sendMessage(
    senderId: string,
    contractId: string,
    data: SendMessageDto,
    file?: Express.Multer.File,
  ) {
    const { receiverId, content } = data;

    const contract = await this.contractRepository.findByPk(contractId);

    if (!contract) {
      throw new NotFoundException(messages.contract.notFound);
    }

    if (senderId !== contract.clientId && senderId !== contract.freelancerId) {
      throw new ForbiddenException(messages.contract.forbidden);
    }

    if ((!content || content.trim() === '') && !file) {
      throw new BadRequestException(messages.message.required);
    }

    let imageUrl = '';

    if (file) {
      const uploadResult = await uploadToCloudinary(file, 'messages');
      imageUrl = uploadResult.secure_url;
    }

    const message = await this.messageRepository.create({
      senderId,
      receiverId,
      contractId,
      content: content || '',
      image: imageUrl,
      isRead: false,
    });

    await this.notificationService.createNotification({
      receiverId,
      senderId,
      type: NotificationType.MESSAGE,
      targetId: message._id.toString(),
      isRead: false,
    });

    const redis = this.redisHelper;

    const key = `messages:contract:${contractId}`;

    await redis.lpush(key, JSON.stringify(message));

    await redis.ltrim(key, 0, 49);

    return response(message, messages.message.send.success);
  }

  async getChatMessages(
    userId: string,
    contractId: string,
    otherUserId: string,
  ) {
    const contract = await this.contractRepository.findByPk(contractId);

    if (!contract) {
      throw new NotFoundException(messages.contract.notFound);
    }

    if (userId !== contract.clientId && userId !== contract.freelancerId) {
      throw new ForbiddenException(messages.contract.forbidden);
    }

    const key = `chat:contract:${contractId}:users:${userId}:${otherUserId}`;

    const cached = await this.redisHelper.lrange(key, 0, -1);

    if (cached.length > 0) {
      return response(
        cached.map((m) => JSON.parse(m)),
        null,
      );
    }

    const data = await this.messageRepository.findChatMessages(
      contractId,
      userId,
      otherUserId,
    );

    for (const msg of data) {
      await this.redisHelper.lpush(key, JSON.stringify(msg));
    }

    await this.redisHelper.ltrim(key, 0, 49);

    return response(data, null);
  }

  async deleteMessage(authUser: AuthUser, messageId: string) {
    const message = await this.messageRepository.findById(messageId);

    if (!message) {
      throw new NotFoundException(messages.message.notFound);
    }

    assertOwnerOrAdmin({
      ownerId: message.senderId.toString(),
      authUser,
      message: messages.message.forbidden,
    });

    await this.messageRepository.destroy({
      _id: message._id,
    });

    const contractId = message.contractId.toString();

    await this.redisHelper.del(`chat:contract:${contractId}`);

    return response(null, messages.message.delete.success);
  }

  async markMessageAsRead(
    userId: string,
    senderId: string,
    contractId: string,
  ) {
    const contract = await this.contractRepository.findByPk(contractId);

    if (!contract) {
      throw new NotFoundException(messages.contract.notFound);
    }

    if (userId !== contract.clientId && userId !== contract.freelancerId) {
      throw new ForbiddenException(messages.contract.forbidden);
    }

    const modifiedCount = await this.messageRepository.markAsRead(
      senderId,
      userId,
      contractId,
    );

    const redis = this.redisHelper;

    if (modifiedCount > 0) {
      const unreadKey = `unread_count:${userId}`;

      const current = await redis.get(unreadKey);

      if (current) {
        const newValue = Math.max(0, Number(current) - modifiedCount);
        await redis.set(unreadKey, newValue,60); 
      }
    }

    await redis.del(`chat:contract:${contractId}`);

    return response(modifiedCount, messages.message.read.success);
  }
}
