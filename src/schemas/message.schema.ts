import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Contract } from './contract.schema';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({
    type: String,
    required: true,
    ref: User.name,
  })
  senderId!: string;

  @Prop({
    type: String,
    required: true,
    ref: User.name,
  })
  receiverId!: string;

  @Prop({
    type: String,
    ref: Contract.name,
    required: true,
  })
  contractId!: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  content!: string;

  @Prop({
    type: String,
    default: null,
  })
  image!: string;

  @Prop({
    type: Boolean,
    default: false,
  })
  isRead!: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
