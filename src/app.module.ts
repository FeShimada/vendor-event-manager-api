import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { OrderModule } from './order/order.module';
import { ProductModule } from './product/product.module';
import { EventModule } from './event/event.module';
import { MercadoPagoModule } from './integrations/mercado-pago/mercado-pago.module';
import { TerminalModule } from './terminal/terminal.module';

@Module({
  imports: [
    AuthModule,
    OrderModule,
    ProductModule,
    EventModule,
    MercadoPagoModule,
    TerminalModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
