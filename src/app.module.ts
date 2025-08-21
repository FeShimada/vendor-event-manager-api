import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { MpNotificationModule } from './mp-notification/mp-notification.module';
import { MpOrderModule } from './mp-order/mp-order.module';
import { ProductModule } from './product/product.module';

@Module({
  imports: [AuthModule, MpNotificationModule, MpOrderModule, ProductModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
