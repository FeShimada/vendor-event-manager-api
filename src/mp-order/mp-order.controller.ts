import {
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import { Body, Param } from '@nestjs/common';
import { MpOrderService } from './service/mp-order.service';
import { CreateMpOrderDto, OrderStatusDto } from './dto/create-mp-order.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { MercadoPagoExceptionFilter } from 'src/common/filters/mercado-pago-exception.filter';

@Controller('mp-order')
@UseFilters(MercadoPagoExceptionFilter)
export class MpOrderController {
  constructor(private readonly mpOrderService: MpOrderService) { }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createMpOrderDto: CreateMpOrderDto) {
    return this.mpOrderService.create(createMpOrderDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  findByStatus(@Query('status') status: OrderStatusDto) {
    return this.mpOrderService.findByStatus(status);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mpOrderService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mpOrderService.remove(id);
  }
}
