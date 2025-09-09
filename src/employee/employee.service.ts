import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) { }

  create(createEmployeeDto: CreateEmployeeDto & { userId: string; }) {
    return this.prisma.employee.create({
      data: createEmployeeDto,
    });
  }

  findAll() {
    return this.prisma.employee.findMany();
  }

  findOne(id: string) {
    const employee = this.prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    return this.prisma.employee.update({
      where: { id },
      data: updateEmployeeDto,
    });
  }

  remove(id: string) {
    const employee = this.prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return this.prisma.employee.delete({
      where: { id },
    });
  }
}
