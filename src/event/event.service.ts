import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AddProductsToEventDto } from './dto/add-products-to-event.dto';
import { EventCategory, EventEmployeeRole, EventRecurrence, EventStatus } from '@prisma/client';
import { AddTerminalToEventDto } from './dto/add-terminals-to-event.dto';
import { AddEmployeeToEventDto } from './dto/add-emplotee-to-event.dto';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createEventDto: CreateEventDto & { userId: string; }) {
    const {
      userId,
      name,
      description,
      notes,
      category,
      status,
      recurrence,
      startDate,
      endDate,
      photo,
      checklist,
      commissionRate,
      participationFee,
      contactInfo,
      address,
      productIds,
      occurrences,
      terminalIds,
    } = createEventDto;

    return this.prisma.event.create({
      data: {
        userId,
        name,
        description,
        notes,
        category,
        status: (status as EventStatus) || 'DRAFT',
        recurrence: (recurrence as EventRecurrence) || 'NONE',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        photo,
        checklist,
        commissionRate,
        participationFee,
        contactInfo,
        address: address
          ? {
            create: {
              street: address.street,
              number: address.number,
              complement: address.complement,
              neighborhood: address.neighborhood,
              city: address.city,
              state: address.state,
              zipCode: address.zipCode,
              country: address.country || 'Brasil',
            },
          }
          : undefined,
        products:
          productIds && productIds.length > 0
            ? {
              create: productIds.map((productId) => ({
                productId,
              })),
            }
            : undefined,
        occurrences:
          occurrences && occurrences.length > 0
            ? {
              create: occurrences.map((occurrence) => ({
                date: new Date(occurrence.date),
                startTime: occurrence.startTime
                  ? new Date(occurrence.startTime)
                  : null,
                endTime: occurrence.endTime
                  ? new Date(occurrence.endTime)
                  : null,
              })),
            }
            : undefined,
      },
      include: {
        address: true,
        products: {
          include: {
            product: true,
          },
        },
        occurrences: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async addProductsToEvent(eventId: string, addProductsToEventDto: AddProductsToEventDto) {
    const { productIds } = addProductsToEventDto;

    const existingEvent = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      throw new Error(`Evento com ID ${eventId} não encontrado`);
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        products: { create: productIds.map((productId) => ({ productId })) },
      },
      include: {
        address: true,
        products: {
          include: {
            product: true,
          },
        },
        occurrences: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async addTerminalToEvent(eventId: string, addTerminalToEventDto: AddTerminalToEventDto) {

    const { terminalId, isPrimary } = addTerminalToEventDto;

    const existingEvent = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventTerminals: true,
      },
    });

    if (!existingEvent) {
      throw new Error(`Evento com ID ${eventId} não encontrado`);
    }

    const hasPrimaryTerminal = existingEvent.eventTerminals.some(
      (terminal) => terminal.isPrimary === true
    );

    if (existingEvent.eventTerminals.length === 0 && !isPrimary) {
      throw new Error('O primeiro terminal adicionado ao evento deve ser marcado como primário');
    }

    if (hasPrimaryTerminal && isPrimary) {
      throw new Error(`Evento com ID ${eventId} já tem terminal primário`);
    }

    const finalIsPrimary = !hasPrimaryTerminal ? true : isPrimary;

    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        eventTerminals: { create: { terminalId, isPrimary: finalIsPrimary } },
      },
      include: {
        address: true,
        products: {
          include: {
            product: true,
          },
        },
        occurrences: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async addEmployeeToEvent(eventId: string, addEmployeeToEventDto: AddEmployeeToEventDto) {

    const { employeeId, role, expense, password } = addEmployeeToEventDto;

    const existingEvent = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      throw new Error(`Evento com ID ${eventId} não encontrado`);
    }

    const existingEmployee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!existingEmployee) {
      throw new Error(`Funcionário com ID ${employeeId} não encontrado`);
    }

    if (role === EventEmployeeRole.CASHIER) {
      if (!password) {
        throw new Error('A senha é obrigatória para o cargo de caixa');
      }
    }

    return this.prisma.eventEmployee.create({
      data: { eventId, employeeId, role, expense, password },
    });
  }

  async assignCashierToTerminal(eventId: string, employeeId: string, terminalId: string) {
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new Error(`Evento ${eventId} não encontrado`);

      const terminal = await tx.eventTerminal.findUnique({
        where: { id: terminalId },
      });
      if (!terminal) throw new Error(`Terminal ${terminalId} não encontrado`);
      if (terminal.eventId !== eventId) throw new Error(`Terminal não pertence ao evento ${eventId}`);
      if (terminal.isPrimary) throw new Error(`Terminal primário não pode ter cashier`);

      const employee = await tx.eventEmployee.findUnique({
        where: { id: employeeId },
      });
      if (!employee) throw new Error(`Funcionário ${employeeId} não encontrado`);
      if (employee.eventId !== eventId) throw new Error(`Funcionário não pertence ao evento ${eventId}`);
      if (employee.role !== EventEmployeeRole.CASHIER) throw new Error(`Funcionário não é um caixa`);

      if (terminal.cashierId) throw new Error(`Terminal já está atribuído`);
      const employeeWithTerminal = await tx.eventTerminal.findFirst({
        where: { cashierId: employeeId, eventId },
      });
      if (employeeWithTerminal) throw new Error(`Funcionário já está atribuído a outro terminal`);

      return tx.eventTerminal.update({
        where: { id: terminalId },
        data: { cashierId: employeeId },
      });
    });
  }

  async unassignCashierFromTerminal(eventId: string, terminalId: string) {
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new Error(`Evento ${eventId} não encontrado`);

      const terminal = await tx.eventTerminal.findUnique({
        where: { id: terminalId },
      });
      if (!terminal) throw new Error(`Terminal ${terminalId} não encontrado`);
      if (terminal.eventId !== eventId) throw new Error(`Terminal não pertence ao evento ${eventId}`);
      if (terminal.isPrimary) throw new Error(`Terminal primário não pode ter caixa desassociado`);

      if (!terminal.cashierId) throw new Error(`Terminal não possui caixa atribuído`);

      return tx.eventTerminal.update({
        where: { id: terminalId },
        data: { cashierId: null },
      });
    });
  }

  async findAll() {
    return this.prisma.event.findMany({
      include: {
        address: true,
        products: {
          include: {
            product: true,
          },
        },
        occurrences: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const event = this.prisma.event.findUnique({
      where: { id },
      include: {
        address: true,
        products: {
          include: {
            product: true,
          },
        },
        occurrences: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Evento com ID ${id} não encontrado`);
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto & { userId: string; }) {
    const {
      userId,
      name,
      description,
      notes,
      category,
      status,
      recurrence,
      startDate,
      endDate,
      photo,
      checklist,
      commissionRate,
      participationFee,
      contactInfo,
      address,
      productIds,
      occurrences,
      terminalIds,
    } = updateEventDto;

    if (productIds) {
      await this.prisma.eventProduct.deleteMany({
        where: { eventId: id },
      });
    }

    if (occurrences) {
      await this.prisma.eventOccurrence.deleteMany({
        where: { eventId: id },
      });
    }

    return this.prisma.event.update({
      where: { id },
      data: {
        userId,
        name,
        description,
        notes,
        category: category as EventCategory,
        status: status as EventStatus,
        recurrence: recurrence as EventRecurrence,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        photo,
        checklist,
        commissionRate,
        participationFee,
        contactInfo,
        address: address
          ? {
            upsert: {
              create: {
                street: address.street,
                number: address.number,
                complement: address.complement,
                neighborhood: address.neighborhood,
                city: address.city,
                state: address.state,
                zipCode: address.zipCode,
                country: address.country || 'Brasil',
              },
              update: {
                street: address.street,
                number: address.number,
                complement: address.complement,
                neighborhood: address.neighborhood,
                city: address.city,
                state: address.state,
                zipCode: address.zipCode,
                country: address.country || 'Brasil',
              },
            },
          }
          : undefined,
        products:
          productIds && productIds.length > 0
            ? {
              create: productIds.map((productId) => ({
                productId,
              })),
            }
            : undefined,
        occurrences:
          occurrences && occurrences.length > 0
            ? {
              create: occurrences.map((occurrence) => ({
                date: new Date(occurrence.date),
                startTime: occurrence.startTime
                  ? new Date(occurrence.startTime)
                  : null,
                endTime: occurrence.endTime
                  ? new Date(occurrence.endTime)
                  : null,
              })),
            }
            : undefined,
        eventTerminals:
          terminalIds && terminalIds.length > 0
            ? {
              create: terminalIds.map((terminalId) => ({ terminalId })),
            }
            : undefined,
      },
      include: {
        address: true,
        products: {
          include: {
            product: true,
          },
        },
        occurrences: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        orders: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Evento com ID ${id} não encontrado`);
    }

    if (event.orders.length > 0) {
      return this.prisma.event.update({
        where: { id },
        data: { status: EventStatus.ARCHIVED },
      });
    }

    if (event.status === EventStatus.DRAFT) {
      return this.prisma.event.delete({
        where: { id },
        include: {
          address: true,
          products: {
            include: {
              product: true,
            },
          },
          occurrences: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }

    return this.prisma.event.delete({
      where: { id },
    });
  }
}
