import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { IPaymentRepository } from 'src/interfaces/payment.interface';
import { Payment, PaymentDocument } from 'src/schemas/payment.schema';

@Injectable()
export class PaymentRepository implements IPaymentRepository {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
  ) {}

  async create(data: Partial<PaymentDocument>): Promise<PaymentDocument> {
    return this.paymentModel.create(data);
  }

  async findById(paymentId: string): Promise<PaymentDocument | null> {
    return this.paymentModel.findById(paymentId).exec();
  }

  async findByUserId(userId: string): Promise<PaymentDocument[]> {
    return this.paymentModel
      .find({
        $or: [{ clientId: userId }, { freelancerId: userId }],
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async update(
    data: Partial<PaymentDocument>,
    where: Partial<PaymentDocument>,
  ): Promise<void> {
    await this.paymentModel.updateMany(where, data);
  }

  async destroy(where: Partial<PaymentDocument>): Promise<void> {
    await this.paymentModel.deleteOne(where);
  }

  async deleteAll(where: any = {}): Promise<void> {
    await this.paymentModel.deleteMany(where).exec();
  }
}
