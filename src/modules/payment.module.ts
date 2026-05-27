import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentController } from 'src/controllers/payment.controller';
import { ContractRepository } from 'src/repository/contract.repository';
import { PaymentRepository } from 'src/repository/payment.repository';
import { ProposalRepository } from 'src/repository/proposal.repository';
import { UserRepository } from 'src/repository/user.repository';
import { Contract, ContractSchema } from 'src/schemas/contract.schema';
import { Payment, PaymentSchema } from 'src/schemas/payment.schema';
import { Proposal, ProposalSchema } from 'src/schemas/proposal.schema';
import { User, UserSchema } from 'src/schemas/user.schema';
import { PaymentService } from 'src/services/payment.service';
import { TokenModule } from 'src/token/token.module';
import { NotificationModule } from './notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    MongooseModule.forFeature([
      { name: Contract.name, schema: ContractSchema },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: Proposal.name, schema: ProposalSchema },
    ]),
    TokenModule,
    NotificationModule,
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    {
      provide: 'IPaymentRepository',
      useClass: PaymentRepository,
    },
    {
      provide: 'IContractRepository',
      useClass: ContractRepository,
    },
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'IProposalRepository',
      useClass: ProposalRepository,
    },
  ],
})
export class PaymentModule {}
