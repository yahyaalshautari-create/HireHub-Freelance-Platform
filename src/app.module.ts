import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth.module';
import { TokenModule } from './token/token.module';
import { AppController } from './app.controller';
import { UserModule } from './modules/user.module';
import { FreelancerModule } from './modules/freelancer.module';
import { ClientModule } from './modules/client.module';
import { FreelancerProjectModule } from './modules/freelancer-project.module';
import { ProjectModule } from './modules/project.module';
import { ProposalModule } from './modules/proposal.module';
import { ProposalOptionModule } from './modules/proposal-option.module';
import { ContractOptionModule } from './modules/contract-option.module';
import { ContractModule } from './modules/contract.module';
import { MessageModule } from './modules/message.module';
import { PaymentModule } from './modules/payment.module';
import { NotificationModule } from './modules/notification.module';
import { ProposalHelperModule } from './modules/proposal-helper.module';
import { ChatGateway } from './gateways/chat.gateway';
import { NotificationGateway } from './gateways/notification.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URL as string),
    AuthModule,
    UserModule,
    FreelancerModule,
    ClientModule,
    FreelancerProjectModule,
    ProjectModule,
    ProposalModule,
    ProposalOptionModule,
    ContractModule,
    ContractOptionModule,
    MessageModule,
    PaymentModule,
    NotificationModule,
    ProposalHelperModule,
    TokenModule,
  ],
  controllers: [AppController],
  providers: [AppService, ChatGateway, NotificationGateway],
})
export class AppModule {}
