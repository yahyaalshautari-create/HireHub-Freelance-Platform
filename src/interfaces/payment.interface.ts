import { PaymentDocument } from 'src/schemas/payment.schema';

export interface IPaymentRepository {
  create(data: Partial<PaymentDocument>): Promise<PaymentDocument>;

  findById(paymentId: string): Promise<PaymentDocument | null>;

  findByUserId(userId: string): Promise<PaymentDocument[]>;

  update(
    data: Partial<PaymentDocument>,
    where: Partial<PaymentDocument>,
  ): Promise<void>;

  destroy(where: Partial<PaymentDocument>): Promise<void>;

  deleteAll(where?: any): Promise<void>;
}
