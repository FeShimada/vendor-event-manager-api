import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMpOrderDto, OrderStatusDto } from './dto/create-mp-order.dto';

@Injectable()
export class MpOrderService {

    constructor(private readonly prisma: PrismaService) { }

    async create(createMpOrderDto: CreateMpOrderDto) {

        const {
            userId,
            eventId,
            amount,
            items
        } = createMpOrderDto;

        return this.prisma.order.create({
            data: {
                userId,
                eventId,
                amount,
                status: OrderStatusDto.CREATED,
                items: {
                    create: items.map(item => ({
                        eventProductId: item.eventProductId,
                        quantity: item.quantity,
                        total: item.total
                    }))
                }
            },
            include: {
                items: {
                    include: {
                        eventProduct: true,
                    }
                }
            }
        });
    }

    async findByStatus(status: OrderStatusDto) {
        return this.prisma.order.findMany({
            where: {
                status
            },
            include: {
                items: {
                    include: {
                        eventProduct: {
                            include: {
                                product: true,
                            }
                        },
                    }
                }
            }
        });
    }

    async findOne(id: string) {
        return this.prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        eventProduct: true,
                    }
                }
            }
        });
    }

    async remove(id: string) {
        return this.prisma.order.delete({
            where: { id }
        });
    }
}
