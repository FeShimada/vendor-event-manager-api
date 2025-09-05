import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { NotificationModule } from './notification/notification.module';
import { OrderService } from './order/order.service';
import { TerminalService } from './terminal/order.service';

@Module({
    imports: [NotificationModule, AuthModule,],
    exports: [OrderService, AuthModule, NotificationModule, TerminalService],
    providers: [PrismaService, OrderService, TerminalService],
})
export class MercadoPagoModule { }
