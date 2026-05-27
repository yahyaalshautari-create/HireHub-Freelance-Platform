import {
  Notification,
  NotificationDocument,
} from 'src/schemas/notification.schema';

export interface INotificationRepository {
  create(data: Partial<Notification>): Promise<NotificationDocument>;

  findByUser(userId: string): Promise<NotificationDocument[]>;

  findUnreadCount(userId: string): Promise<number>;

  markAsRead(notificationId: string): Promise<NotificationDocument | null>;

  markAllAsRead(userId: string): Promise<void>;

  destroy(notificationId: string): Promise<NotificationDocument | null>;

  deleteAll(where?: any): Promise<void>;
}
