import { Module } from '@nestjs/common';
import { MpOrderController } from './mp-order.controller';
import { MpOrderService } from './service/mp-order.service';
import { PriceCalculatorService } from './service/price-calculator.service';
import { OrderBusinessService } from './service/order-business.service';
import { MercadoPagoService } from './service/mercado-pago.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [MpOrderController],
  providers: [
    MpOrderService,
    PriceCalculatorService,
    OrderBusinessService,
    MercadoPagoService,
    PrismaService,
  ],
})
export class MpOrderModule { }
