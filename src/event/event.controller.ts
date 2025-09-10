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
import { AddTerminalToEventDto } from './dto/add-terminals-to-event.dto';
import { AddEmployeeToEventDto } from './dto/add-emplotee-to-event.dto';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) { }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createEventDto: CreateEventDto, @User() user: { userId: string; }) {
    return this.eventService.create({ ...createEventDto, userId: user.userId });
  }

  @UseGuards(AuthGuard)
  @Post(':id/products')
  addProductToEvent(@Param('id') id: string, @Body() addProductToEventDto: AddProductsToEventDto) {
    return this.eventService.addProductsToEvent(id, addProductToEventDto);
  }

  @UseGuards(AuthGuard)
  @Post(':id/terminal')
  addTerminalToEvent(@Param('id') id: string, @Body() addTerminalToEventDto: AddTerminalToEventDto) {
    return this.eventService.addTerminalToEvent(id, addTerminalToEventDto);
  }

  @UseGuards(AuthGuard)
  @Post(':id/employee')
  addEmployeeToEvent(@Param('id') id: string, @Body() addEmployeeToEventDto: AddEmployeeToEventDto) {
    return this.eventService.addEmployeeToEvent(id, addEmployeeToEventDto);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/terminals/:terminalId/assign-cashier/:employeeId')
  assignCashierToTerminal(@Param('id') id: string, @Param('employeeId') employeeId: string, @Param('terminalId') terminalId: string) {
    return this.eventService.assignCashierToTerminal(id, employeeId, terminalId);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/terminals/:terminalId/unassign-cashier')
  unassignCashierFromTerminal(@Param('id') id: string, @Param('terminalId') terminalId: string) {
    return this.eventService.unassignCashierFromTerminal(id, terminalId);
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
