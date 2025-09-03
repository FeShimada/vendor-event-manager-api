import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderService } from './order.service';

@Module({
    controllers: [],
    providers: [PrismaService, OrderService],
})
export class OrderModule { }
