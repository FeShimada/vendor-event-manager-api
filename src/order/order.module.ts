import { Module } from '@nestjs/common';
import { PriceCalculatorService } from './service/price-calculator.service';
import { OrderBusinessService } from './service/order-business.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderService } from './service/order.service';
import { OrderController } from './order.controller';
import { OrderService as MercadoPagoOrderService } from 'src/integrations/mercado-pago/order/order.service';

@Module({
  controllers: [OrderController],
  providers: [
    OrderService,
    PriceCalculatorService,
    OrderBusinessService,
    PrismaService,
    MercadoPagoOrderService,
  ],
})
export class OrderModule { }
