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
import { OrderService } from './service/order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { MercadoPagoExceptionFilter } from 'src/common/filters/mercado-pago-exception.filter';
import { OrderStatus } from '@prisma/client';
import { User } from 'src/common/decorators/user.decorator';

@Controller('order')
@UseFilters(MercadoPagoExceptionFilter)
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @User() user: { userId: string; }) {
    return this.orderService.create({ ...createOrderDto, userId: user.userId });
  }

  @UseGuards(AuthGuard)
  @Get()
  findByStatus(@Query('status') status: OrderStatus) {
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
