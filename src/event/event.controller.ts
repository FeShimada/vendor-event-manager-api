import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { AddProductsToEventDto } from './dto/add-products-to-event.dto';
import { User } from 'src/common/decorators/user.decorator';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) { }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createEventDto: CreateEventDto, @User() user: { userId: string; }) {
    return this.eventService.create({ ...createEventDto, userId: user.userId });
  }

  @UseGuards(AuthGuard)
  @Post('add-products-to-event')
  addProductToEvent(@Body() addProductToEventDto: AddProductsToEventDto) {
    return this.eventService.addProductsToEvent(addProductToEventDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll() {
    return this.eventService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto, @User() user: { userId: string; }) {
    return this.eventService.update(id, { ...updateEventDto, userId: user.userId });
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventService.remove(id);
  }
}
