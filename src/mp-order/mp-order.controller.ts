import { Controller, Delete, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Body, Param } from '@nestjs/common';
import { MpOrderService } from './mp-order.service';
import { CreateMpOrderDto, OrderStatusDto } from './dto/create-mp-order.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('mp-order')
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
