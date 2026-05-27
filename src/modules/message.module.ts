import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageController } from 'src/controllers/message.controller';
import { ContractRepository } from 'src/repository/contract.repository';
import { MessageRepository } from 'src/repository/message.repository';
import { Contract, ContractSchema } from 'src/schemas/contract.schema';
import { Message, MessageSchema } from 'src/schemas/message.schema';
import { MessageService } from 'src/services/message.service';
import { TokenModule } from 'src/token/token.module';
import { NotificationModule } from './notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    MongooseModule.forFeature([
      { name: Contract.name, schema: ContractSchema },
    ]),
    TokenModule,
    NotificationModule,
  ],
  controllers: [MessageController],
  providers: [
    MessageService,
    { provide: 'IMessageRepository', useClass: MessageRepository },
    { provide: 'IContractRepository', useClass: ContractRepository },
  ],
})
export class MessageModule {}
