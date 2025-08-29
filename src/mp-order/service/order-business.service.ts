import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMpOrderDto } from '../dto/create-mp-order.dto';
import { PriceCalculatorService } from './price-calculator.service';

@Injectable()
export class OrderBusinessService {
    private readonly logger = new Logger(OrderBusinessService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly priceCalculator: PriceCalculatorService,
    ) { }

    async processOrderCreation(createMpOrderDto: CreateMpOrderDto) {
        const { userId, eventId, items } = createMpOrderDto;

        this.logger.log(
            `Processando criação de ordem para usuário ${userId} no evento ${eventId}`,
        );

        await this.priceCalculator.validateItemsAvailability(eventId, items);

        const calculation = await this.priceCalculator.calculateOrderPrices(
            eventId,
            items,
        );

        if (calculation.totalAmount <= 0) {
            throw new Error('O valor total da ordem deve ser maior que zero');
        }

        this.logger.log(
            `Ordem processada com sucesso. Total: R$ ${calculation.totalAmount.toFixed(2)}`,
        );

        return {
            userId,
            eventId,
            items: calculation.items,
            totalAmount: calculation.totalAmount,
        };
    }

    async validateOrderData(createMpOrderDto: CreateMpOrderDto): Promise<void> {
        const { userId, eventId, items } = createMpOrderDto;

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            throw new Error('Evento não encontrado');
        }

        if (event.status !== 'ACTIVE') {
            throw new Error('Evento não está ativo');
        }

        if (!items || items.length === 0) {
            throw new Error('A ordem deve conter pelo menos um item');
        }

        const eventProductIds = items.map((item) => item.eventProductId);
        const uniqueIds = new Set(eventProductIds);

        if (uniqueIds.size !== eventProductIds.length) {
            throw new Error('A ordem não pode conter itens duplicados');
        }

        for (const item of items) {
            if (item.quantity <= 0) {
                throw new Error(
                    `Quantidade inválida para o item ${item.eventProductId}`,
                );
            }
        }

        this.logger.log('Validação dos dados da ordem concluída com sucesso');
    }
}
