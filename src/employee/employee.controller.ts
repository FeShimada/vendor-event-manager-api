import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { User } from 'src/common/decorators/user.decorator';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) { }

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createEmployeeDto: CreateEmployeeDto, @User() user: { userId: string; }) {
    return this.employeeService.create({ ...createEmployeeDto, userId: user.userId });
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.employeeService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.employeeService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeeService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.employeeService.remove(id);
  }
}
