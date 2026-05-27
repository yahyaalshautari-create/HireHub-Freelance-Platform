import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { response } from 'src/libs/helpers';
import { messages } from 'src/libs/messages';
import type { INotificationRepository } from 'src/interfaces/notification.interface';
import { Notification } from 'src/schemas/notification.schema';
import { RedisHelper } from 'src/redis/redis.helper';

@Injectable()
export class NotificationService {
  constructor(
    @Inject('INotificationRepository')
    private readonly notificationRepository: INotificationRepository,

    private readonly redisHelper: RedisHelper,
  ) {}

  async createNotification(data: Notification) {
    if (data.receiverId === data.senderId) return;

    const notification = await this.notificationRepository.create({
      receiverId: data.receiverId,
      senderId: data.senderId,
      type: data.type,
      targetId: data.targetId,
      isRead: false,
    });

    const key = `notifications:${data.receiverId}`;
    const countKey = `unread_count:${data.receiverId}`;

    await this.redisHelper.incr(countKey);

    await this.redisHelper.lpush(key, notification);

    await this.redisHelper.ltrim(key, 0, 19);
  }

  async getUserNotifications(userId: string) {
    const notifications = await this.notificationRepository.findByUser(userId);

    return response(notifications, null);
  }

  async getUnreadCount(userId: string) {
    const key = `unread_count:${userId}`;

    const cached = await this.redisHelper.get(key);

    if (cached !== null) {
      return response(Number(cached), null);
    }

    const count = await this.notificationRepository.findUnreadCount(userId);

    await this.redisHelper.set(key, count);

    return response(count, null);
  }

  async markAsRead(notificationId: string) {
    const notification =
      await this.notificationRepository.markAsRead(notificationId);

    if (notification) {
      await this.redisHelper.decr(`unread_count:${notification.receiverId}`);
    }

    return response(notification, null);
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.markAllAsRead(userId);

    const key = `unread_count:${userId}`;

    await this.redisHelper.set(key, 0);

    return response(null, messages.notification.read.success);
  }

  async deleteNotification(notificationId: string) {
    const notification =
      await this.notificationRepository.destroy(notificationId);

    if (!notification) {
      throw new NotFoundException(messages.notification.notFound);
    }

    const listKey = `notifications:${notification.receiverId}`;
    const countKey = `unread_count:${notification.receiverId}`;

    await this.redisHelper.lrem(listKey, notificationId);

    if (!notification.isRead) {
      await this.redisHelper.decr(countKey);
    }

    return response(null, messages.notification.delete.success);
  }
}
