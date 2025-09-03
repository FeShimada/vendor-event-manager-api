import {
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
  UseFilters,
  Request,
} from '@nestjs/common';
import { Body, Param } from '@nestjs/common';
import { OrderService } from './service/order.service';
import { CreateOrderDto, OrderStatusDto } from './dto/create-order.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { MercadoPagoExceptionFilter } from 'src/common/filters/mercado-pago-exception.filter';

@Controller('order')
@UseFilters(MercadoPagoExceptionFilter)
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    console.log(req.user);
    return this.orderService.create({ ...createOrderDto, userId: req.user.userId });
  }

  @UseGuards(AuthGuard)
  @Get()
  findByStatus(@Query('status') status: OrderStatusDto) {
    return this.orderService.findByStatus(status);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(id);
  }
}
