import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Notification,
  NotificationDocument,
} from 'src/schemas/notification.schema';

import { INotificationRepository } from 'src/interfaces/notification.interface';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(data: Partial<Notification>): Promise<NotificationDocument> {
    return this.notificationModel.create(data);
  }

  async findByUser(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({ receiverId: userId })
      .populate('senderId', 'fullname avatar email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      receiverId: userId,
      isRead: false,
    });
  }

  async markAsRead(
    notificationId: string,
  ): Promise<NotificationDocument | null> {
    return this.notificationModel.findOneAndUpdate(
      { _id: notificationId },
      { isRead: true },
      { new: true },
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { receiverId: userId, isRead: false },
      { isRead: true },
    );
  }

  async destroy(notificationId: string): Promise<NotificationDocument | null> {
    const notification = await this.notificationModel.findById(notificationId);
    if (!notification) return null;

    await this.notificationModel.deleteOne({ _id: notificationId });

    return notification;
  }

  async deleteAll(where: any = {}): Promise<void> {
    await this.notificationModel.deleteMany(where).exec();
  }
}
