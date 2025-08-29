import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMpOrderDto, OrderStatusDto } from './dto/create-mp-order.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MpOrderService {

    constructor(private readonly prisma: PrismaService) { }

    private readonly logger = new Logger(MpOrderService.name);

    async create(createMpOrderDto: CreateMpOrderDto) {

        const {
            userId,
            eventId,
            amount,
            items
        } = createMpOrderDto;

        return await this.prisma.$transaction(async (prisma) => {
            const order = await prisma.order.create({
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

            try {
                await this.createMercadoPagoOrder(order, prisma);

                return order;
            } catch (error) {
                this.logger.error(`Erro ao criar ordem no Mercado Pago: ${error.message}`);

                throw new Error(`Falha ao processar pagamento: ${error.message}`);
            }
        });
    }

    async createMercadoPagoOrder(order, prismaClient: any = this.prisma) {
        const mpBaseUrl = process.env.MP_BASE_URL;
        const mpAccessToken = process.env.MP_ACCESS_TOKEN;
        const mpTerminalId = process.env.MP_TERMINAL_ID;
        const idempotencyKey = uuidv4();

        if (!mpBaseUrl || !mpAccessToken || !mpTerminalId) {
            this.logger.error('Configurações do Mercado Pago não encontradas');
            throw new Error('Configurações do Mercado Pago não encontradas');
        }

        const requestBody = {
            type: "point",
            external_reference: order.id,
            transactions: {
                payments: [
                    {
                        amount: order.amount
                    }
                ]
            },
            config: {
                point: {
                    terminal_id: mpTerminalId
                }
            }
        };

        this.logger.log(`Tentando criar ordem no Mercado Pago para orderId: ${order.id}`);

        try {
            const response = await fetch(`${mpBaseUrl}/v1/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${mpAccessToken}`,
                    'X-Idempotency-Key': idempotencyKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.text();
                this.logger.error(`Erro na API do Mercado Pago: ${response.status} - ${errorData}`);
                throw new Error(`Erro na API do Mercado Pago: ${response.status} - ${errorData}`);
            }

            const mpOrderData = await response.json();

            this.logger.log(`Ordem criada com sucesso no Mercado Pago. OrderId: ${order.id}, MP OrderId: ${mpOrderData.id}`);

            await prismaClient.order.update({
                where: { id: order.id },
                data: {
                    mercadoPagoId: mpOrderData.id,
                    externalRef: mpOrderData.external_reference
                }
            });

            return mpOrderData;
        } catch (error) {
            this.logger.error(`Falha ao criar ordem no Mercado Pago para orderId ${order.id}: ${error.message}`);
            throw new Error(`Falha ao criar ordem no Mercado Pago: ${error.message}`);
        }
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
