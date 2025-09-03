import { Module } from '@nestjs/common';
import { PriceCalculatorService } from './service/price-calculator.service';
import { OrderBusinessService } from './service/order-business.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderService } from './service/order.service';
import { OrderController } from './order.controller';
import { MercadoPagoModule } from 'src/integrations/mercado-pago/mercado-pago.module';

@Module({
  imports: [MercadoPagoModule],
  controllers: [OrderController],
  providers: [
    OrderService,
    PriceCalculatorService,
    OrderBusinessService,
    PrismaService,
  ],
})
export class OrderModule { }
