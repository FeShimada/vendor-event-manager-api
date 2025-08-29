import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMpOrderDto, OrderStatusDto } from '../dto/create-mp-order.dto';
import { OrderBusinessService } from './order-business.service';
import { MercadoPagoService } from './mercado-pago.service';

@Injectable()
export class MpOrderService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly orderBusiness: OrderBusinessService,
        private readonly mercadoPagoService: MercadoPagoService,
    ) { }

    private readonly logger = new Logger(MpOrderService.name);

    async create(createMpOrderDto: CreateMpOrderDto) {
        return await this.prisma.$transaction(async (prisma) => {
            await this.orderBusiness.validateOrderData(createMpOrderDto);

            const processedOrder =
                await this.orderBusiness.processOrderCreation(createMpOrderDto);

            const order = await prisma.order.create({
                data: {
                    userId: processedOrder.userId,
                    eventId: processedOrder.eventId,
                    amount: processedOrder.totalAmount,
                    status: OrderStatusDto.CREATED,
                    items: {
                        create: processedOrder.items.map((item) => ({
                            eventProductId: item.eventProductId,
                            quantity: item.quantity,
                            total: item.total,
                        })),
                    },
                },
                include: {
                    items: {
                        include: {
                            eventProduct: true,
                        },
                    },
                },
            });

            try {
                await this.mercadoPagoService.createOrder(order, prisma);

                return order;
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : 'Erro desconhecido';
                this.logger.error(
                    `Erro ao criar ordem no Mercado Pago: ${errorMessage}`,
                );

                throw new Error(`Falha ao processar pagamento: ${errorMessage}`);
            }
        });
    }

    async findByStatus(status: OrderStatusDto) {
        return this.prisma.order.findMany({
            where: {
                status,
            },
            include: {
                items: {
                    include: {
                        eventProduct: {
                            include: {
                                product: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async findOne(id: string) {
        return this.prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        eventProduct: true,
                    },
                },
            },
        });
    }

    async remove(id: string) {
        return this.prisma.order.delete({
            where: { id },
        });
    }
}
