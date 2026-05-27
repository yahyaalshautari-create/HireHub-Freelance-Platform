import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PaymentStatus } from 'src/enums/payment.enum';
import { User } from './user.schema';
import { Contract } from './contract.schema';
import { Document } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({
    type: String,
    ref: User.name,
    required: true,
  })
  clientId!: string;

  @Prop({
    type: String,
    ref: User.name,
    required: true,
  })
  freelancerId!: string;

  @Prop({
    type: String,
    ref: Contract.name,
    required: true,
  })
  contractId!: string;

  @Prop({
    type: Number,
    required: true,
  })
  amount!: number;

  @Prop({
    type: String,
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Prop({ default: false })
  isReleased!: boolean;

  @Prop()
  releasedAt?: Date;

  @Prop()
  refundedAt?: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
