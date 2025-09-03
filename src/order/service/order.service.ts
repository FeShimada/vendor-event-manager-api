import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto, OrderStatusDto, PaymentMethod } from '../dto/create-order.dto';
import { OrderBusinessService } from './order-business.service';
import { MercadoPagoException } from 'src/common/filters/mercado-pago-exception.filter';
import { OrderService as MercadoPagoOrderService } from 'src/integrations/mercado-pago/order/order.service';

@Injectable()
export class OrderService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly orderBusiness: OrderBusinessService,
        private readonly mercadoPagoService: MercadoPagoOrderService,
    ) { }

    private readonly logger = new Logger(OrderService.name);

    async create(createOrderDto: CreateOrderDto & { userId: string; }) {
        try {
            return await this.prisma.$transaction(async (prisma) => {
                await this.orderBusiness.validateOrderData(createOrderDto);

                const processedOrder =
                    await this.orderBusiness.processOrderCreation(createOrderDto);

                const order = await prisma.order.create({
                    data: {
                        userId: processedOrder.userId,
                        eventId: processedOrder.eventId,
                        amount: processedOrder.totalAmount,
                        status: createOrderDto.paymentMethod === PaymentMethod.CASH ? OrderStatusDto.PROCESSED : OrderStatusDto.CREATED,
                        paymentMethod: createOrderDto.paymentMethod,
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
                                eventProduct: {
                                    include: {
                                        product: true,
                                    },
                                },
                            },
                        },
                    },
                });

                return await this.mercadoPagoService.createOrder(order, prisma);
            });
        } catch (error) {
            if (error instanceof MercadoPagoException) {
                this.logger.error(
                    `Erro do Mercado Pago ao criar ordem: ${error.message}`,
                );
                throw error;
            }

            const errorMessage =
                error instanceof Error ? error.message : 'Erro desconhecido';
            this.logger.error(
                `Erro ao criar ordem no Mercado Pago: ${errorMessage}`,
            );

            throw new Error(`Falha ao processar pagamento: ${errorMessage}`);
        }
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
