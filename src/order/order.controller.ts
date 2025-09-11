import {
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
  UseFilters,
  Request,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Body, Param } from '@nestjs/common';
import { OrderService } from './service/order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard, UserOrEmployeeGuard } from 'src/auth/auth.guard';
import { MercadoPagoExceptionFilter } from 'src/common/filters/mercado-pago-exception.filter';
import { OrderStatus } from '@prisma/client';

@Controller('order')
@UseFilters(MercadoPagoExceptionFilter)
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @UseGuards(UserOrEmployeeGuard)
  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    if (req.user) {
      return this.orderService.create({ ...createOrderDto, userId: req.user.userId });
    }
    if (req.employee) {
      if (req.employee.role !== 'CASHIER') {
        throw new ForbiddenException('Apenas funcionários de caixa podem criar ordens');
      }
      return this.orderService.create({ ...createOrderDto, userId: req.employee.userId, eventEmployeeId: req.employee.eventEmployeeId });
    }
    throw new UnauthorizedException();
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
