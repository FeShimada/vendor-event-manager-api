import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderService } from './order.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    providers: [PrismaService, OrderService],
    exports: [OrderService],
})
export class OrderModule { }
