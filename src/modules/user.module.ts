import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from 'src/controllers/user.controller';
import { UserRepository } from 'src/repository/user.repository';
import { ProposalRepository } from 'src/repository/proposal.repository';
import { ProjectRepository } from 'src/repository/project.repository';
import { ContractRepository } from 'src/repository/contract.repository';
import { MessageRepository } from 'src/repository/message.repository';
import { PaymentRepository } from 'src/repository/payment.repository';
import { FreelancerRepository } from 'src/repository/freelancer.repository';
import { ClientRepository } from 'src/repository/client.repository';
import { User, UserSchema } from 'src/schemas/user.schema';
import { Proposal, ProposalSchema } from 'src/schemas/proposal.schema';
import { Project, ProjectSchema } from 'src/schemas/project.schema';
import { Contract, ContractSchema } from 'src/schemas/contract.schema';
import { Message, MessageSchema } from 'src/schemas/message.schema';
import { Payment, PaymentSchema } from 'src/schemas/payment.schema';
import { Freelancer, FreelancerSchema } from 'src/schemas/freelancer.schema';
import { Client, ClientSchema } from 'src/schemas/client.schema';
import { UserService } from 'src/services/user.service';
import { UserCleanupService } from 'src/services/user-clean-up.service';
import { TokenModule } from 'src/token/token.module';
import { NotificationModule } from './notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Proposal.name, schema: ProposalSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Freelancer.name, schema: FreelancerSchema },
      { name: Client.name, schema: ClientSchema },
    ]),

    TokenModule,
    NotificationModule,
  ],

  controllers: [UserController],

  providers: [
    UserService,
    UserCleanupService,

    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'IProposalRepository',
      useClass: ProposalRepository,
    },
    {
      provide: 'IProjectRepository',
      useClass: ProjectRepository,
    },
    {
      provide: 'IContractRepository',
      useClass: ContractRepository,
    },
    {
      provide: 'IMessageRepository',
      useClass: MessageRepository,
    },
    {
      provide: 'IPaymentRepository',
      useClass: PaymentRepository,
    },
    {
      provide: 'IFreelancerRepository',
      useClass: FreelancerRepository,
    },
    {
      provide: 'IClientRepository',
      useClass: ClientRepository,
    },
  ],
})
export class UserModule {}
