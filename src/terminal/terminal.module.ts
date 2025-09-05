import { Module } from '@nestjs/common';
import { TerminalService } from './terminal.service';
import { TerminalController } from './terminal.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { MercadoPagoModule } from 'src/integrations/mercado-pago/mercado-pago.module';

@Module({
  imports: [MercadoPagoModule],
  controllers: [TerminalController],
  providers: [TerminalService, PrismaService],
})
export class TerminalModule { }
