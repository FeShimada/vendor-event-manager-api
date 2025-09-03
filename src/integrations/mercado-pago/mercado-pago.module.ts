import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { NotificationModule } from './notification/notification.module';
import { OrderModule } from './order/order.module';

@Module({
    imports: [NotificationModule, OrderModule, AuthModule],
    providers: [PrismaService],
})
export class MercadoPagoModule { }
