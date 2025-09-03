import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { NotificationModule } from './notification/notification.module';
import { OrderService } from './order/order.service';

@Module({
    imports: [NotificationModule, AuthModule],
    exports: [OrderService, AuthModule, NotificationModule],
    providers: [PrismaService, OrderService],
})
export class MercadoPagoModule { }
