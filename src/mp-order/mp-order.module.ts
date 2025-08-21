import { Module } from '@nestjs/common';
import { MpOrderController } from './mp-order.controller';
import { MpOrderService } from './mp-order.service';

@Module({
  controllers: [MpOrderController],
  providers: [MpOrderService]
})
export class MpOrderModule {}
