import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationController } from 'src/controllers/notification.controller';
import { RedisModule } from 'src/redis/redis.module';
import { NotificationRepository } from 'src/repository/notification.repository';
import {
  Notification,
  NotificationSchema,
} from 'src/schemas/notification.schema';
import { NotificationService } from 'src/services/notification.service';
import { TokenModule } from 'src/token/token.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    TokenModule,
    RedisModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    { provide: 'INotificationRepository', useClass: NotificationRepository },
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
