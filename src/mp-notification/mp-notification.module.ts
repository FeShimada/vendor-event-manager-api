import { Module } from '@nestjs/common';
import { MpNotificationController } from './mp-notification.controller';
import { MpNotificationService } from './mp-notification.service';

@Module({
  controllers: [MpNotificationController],
  providers: [MpNotificationService]
})
export class MpNotificationModule {}
