import { Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PrismaService } from '../prisma/prisma.service';
import type { EventCategory, EventStatus, EventRecurrence } from 'generated/prisma';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createEventDto: CreateEventDto) {
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
    } = createEventDto;

    return this.prisma.event.create({
      data: {
        userId,
        name,
        description,
        notes,
        category: category as EventCategory,
        status: (status as EventStatus) || 'ACTIVE',
        recurrence: (recurrence as EventRecurrence) || 'NONE',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        photo,
        checklist,
        commissionRate,
        participationFee,
        contactInfo,
        address: address ? {
          create: {
            street: address.street,
            number: address.number,
            complement: address.complement,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            country: address.country || 'Brasil',
          }
        } : undefined,
        products: productIds && productIds.length > 0 ? {
          create: productIds.map(productId => ({
            productId,
          }))
        } : undefined,
        occurrences: occurrences && occurrences.length > 0 ? {
          create: occurrences.map(occurrence => ({
            date: new Date(occurrence.date),
            startTime: occurrence.startTime ? new Date(occurrence.startTime) : null,
            endTime: occurrence.endTime ? new Date(occurrence.endTime) : null,
          }))
        } : undefined,
      },
      include: {
        address: true,
        products: {
          include: {
            product: true,
          }
        },
        occurrences: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
  }

  async findAll() {
    return this.prisma.event.findMany({
      include: {
        address: true,
        products: {
          include: {
            product: true,
          }
        },
        occurrences: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
  }

  async findOne(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      include: {
        address: true,
        products: {
          include: {
            product: true,
          }
        },
        occurrences: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
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
    } = updateEventDto;

    // Se productIds for fornecido, atualizar relacionamentos
    if (productIds) {
      // Remover produtos existentes
      await this.prisma.eventProduct.deleteMany({
        where: { eventId: id }
      });
    }

    // Se occurrences for fornecido, atualizar ocorrências
    if (occurrences) {
      // Remover ocorrências existentes
      await this.prisma.eventOccurrence.deleteMany({
        where: { eventId: id }
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
        address: address ? {
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
            }
          }
        } : undefined,
        products: productIds && productIds.length > 0 ? {
          create: productIds.map(productId => ({
            productId,
          }))
        } : undefined,
        occurrences: occurrences && occurrences.length > 0 ? {
          create: occurrences.map(occurrence => ({
            date: new Date(occurrence.date),
            startTime: occurrence.startTime ? new Date(occurrence.startTime) : null,
            endTime: occurrence.endTime ? new Date(occurrence.endTime) : null,
          }))
        } : undefined,
      },
      include: {
        address: true,
        products: {
          include: {
            product: true,
          }
        },
        occurrences: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
  }

  async remove(id: string) {
    return this.prisma.event.delete({
      where: { id },
      include: {
        address: true,
        products: {
          include: {
            product: true,
          }
        },
        occurrences: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
  }
}
