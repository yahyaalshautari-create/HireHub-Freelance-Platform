import { MessageDocument } from 'src/schemas/message.schema';

export interface IMessageRepository {
  create(data: Partial<MessageDocument>): Promise<MessageDocument>;

  findById(messageId: string): Promise<MessageDocument | null>;

  findChatMessages(
    contractId: string,
    userId: string,
    otherUserId: string,
  ): Promise<MessageDocument[]>;

  destroy(where: Partial<MessageDocument>): Promise<void>;

  markAsRead(
    senderId: string,
    receiverId: string,
    contractId: string,
  ): Promise<number>;

  deleteAll(where?: any): Promise<void>;
}
