import { Module } from '@nestjs/common';
import { MpOrderController } from './mp-order.controller';
import { MpOrderService } from './mp-order.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [MpOrderController],
  providers: [MpOrderService, PrismaService]
})
export class MpOrderModule { }
