import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IMessageRepository } from 'src/interfaces/message.interface';
import { Message, MessageDocument } from 'src/schemas/message.schema';

@Injectable()
export class MessageRepository implements IMessageRepository {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  async create(data: Partial<MessageDocument>): Promise<MessageDocument> {
    return this.messageModel.create(data);
  }

  async findById(messageId: string): Promise<MessageDocument | null> {
    return this.messageModel.findById(messageId).exec();
  }

  async findChatMessages(
    contractId: string,
    userId: string,
    otherUserId: string,
  ): Promise<MessageDocument[]> {
    return this.messageModel
      .find({
        contractId,
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      })
      .sort({ createdAt: 1 })
      .lean()
      .exec();
  }

  async destroy(where: Partial<MessageDocument>): Promise<void> {
    await this.messageModel.deleteOne(where);
  }

  async markAsRead(
    senderId: string,
    receiverId: string,
    contractId: string,
  ): Promise<number> {
    const result = await this.messageModel.updateMany(
      {
        senderId,
        receiverId,
        contractId,
        isRead: false,
      },
      {
        $set: { isRead: true },
      },
    );

    return result.modifiedCount;
  }

  async deleteAll(where: any = {}): Promise<void> {
    await this.messageModel.deleteMany(where).exec();
  }
}
