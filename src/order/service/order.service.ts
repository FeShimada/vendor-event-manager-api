import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderBusinessService } from './order-business.service';
import { MercadoPagoException } from 'src/common/filters/mercado-pago-exception.filter';
import { OrderService as MercadoPagoOrderService } from 'src/integrations/mercado-pago/order/order.service';
import { Order, OrderStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class OrderService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly orderBusiness: OrderBusinessService,
        private readonly mercadoPagoService: MercadoPagoOrderService,
    ) { }

    private readonly logger = new Logger(OrderService.name);

    async create(createOrderDto: CreateOrderDto & { userId: string; eventEmployeeId?: string; }) {
        try {
            return await this.prisma.$transaction(async (prisma) => {
                await this.orderBusiness.validateOrderData(createOrderDto);

                const processedOrder =
                    await this.orderBusiness.processOrderCreation(createOrderDto);

                let terminalData: { mpTerminalId: string; mpExternalPosId: string | null; } | undefined = undefined;

                if (createOrderDto.eventEmployeeId) {
                    const eventEmployee = await prisma.eventEmployee.findUnique({
                        where: { id: createOrderDto.eventEmployeeId },
                        include: {
                            terminal: {
                                include: {
                                    terminal: true,
                                }
                            }
                        }
                    });

                    if (!eventEmployee?.terminal) {
                        throw new Error('Funcionário não possui terminal associado');
                    }

                    terminalData = {
                        mpTerminalId: eventEmployee.terminal.terminal.mpTerminalId,
                        mpExternalPosId: eventEmployee.terminal.terminal.mpExternalPosId,
                    };
                } else {
                    const eventTerminal = await prisma.eventTerminal.findFirst({
                        where: {
                            eventId: createOrderDto.eventId,
                            isPrimary: true,
                        },
                        include: {
                            terminal: true,
                        }
                    });

                    if (!eventTerminal) {
                        throw new Error('Evento não possui terminal primário associado');
                    }

                    terminalData = {
                        mpTerminalId: eventTerminal.terminal.mpTerminalId,
                        mpExternalPosId: eventTerminal.terminal.mpExternalPosId,
                    };
                }

                const order = await prisma.order.create({
                    data: {
                        userId: processedOrder.userId,
                        eventId: processedOrder.eventId,
                        amount: processedOrder.totalAmount,
                        status: createOrderDto.paymentMethod === PaymentMethod.CASH ? OrderStatus.PROCESSED : OrderStatus.CREATED,
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

                return await this.mercadoPagoService.createOrder(order, prisma, terminalData);
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

    async findByStatus(status: OrderStatus): Promise<Order[]> {
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

    async findOne(id: string): Promise<Order> {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        eventProduct: true,
                    },
                },
            },
        });

        if (!order) {
            throw new NotFoundException('Ordem não encontrada');
        }

        return order;
    }

    async remove(id: string): Promise<Order> {
        const order = await this.prisma.order.findUnique({
            where: { id },
        });

        if (!order) {
            throw new NotFoundException('Ordem não encontrada');
        }

        return this.prisma.order.delete({
            where: { id }
        });
    }
}
