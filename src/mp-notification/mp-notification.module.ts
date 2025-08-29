import { Module } from '@nestjs/common';
import { MpNotificationController } from './mp-notification.controller';
import { MpNotificationService } from './mp-notification.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [MpNotificationController],
  providers: [MpNotificationService, PrismaService]
})
export class MpNotificationModule { }
