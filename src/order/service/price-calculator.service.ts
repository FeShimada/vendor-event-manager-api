import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderItemDto } from '../dto/create-order.dto';

export interface CalculatedItem {
    eventProductId: string;
    quantity: number;
    total: number;
    productName: string;
    unitPrice: number;
}

export interface OrderCalculation {
    items: CalculatedItem[];
    totalAmount: number;
}

@Injectable()
export class PriceCalculatorService {
    private readonly logger = new Logger(PriceCalculatorService.name);

    constructor(private readonly prisma: PrismaService) { }

    async calculateOrderPrices(
        eventId: string,
        items: CreateOrderItemDto[],
    ): Promise<OrderCalculation> {
        this.logger.log(
            `Calculando preços para evento ${eventId} com ${items.length} itens`,
        );

        const eventProducts = await this.prisma.eventProduct.findMany({
            where: {
                id: {
                    in: items.map((item) => item.eventProductId),
                },
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                    },
                },
            },
        });

        const productMap = new Map(eventProducts.map((ep) => [ep.id, ep.product]));

        const calculatedItems: CalculatedItem[] = [];
        let totalAmount = 0;

        for (const item of items) {
            const product = productMap.get(item.eventProductId);

            if (!product) {
                throw new Error(
                    `Produto não encontrado para eventProductId: ${item.eventProductId}`,
                );
            }

            const unitPrice = Number(product.price);
            const itemTotal = unitPrice * item.quantity;

            calculatedItems.push({
                eventProductId: item.eventProductId,
                quantity: item.quantity,
                total: itemTotal,
                productName: product.name,
                unitPrice: unitPrice,
            });

            totalAmount += itemTotal;
        }

        this.logger.log(
            `Cálculo concluído: Total da ordem = R$ ${totalAmount.toFixed(2)}`,
        );

        return {
            items: calculatedItems,
            totalAmount,
        };
    }

    async validateItemsAvailability(
        eventId: string,
        items: CreateOrderItemDto[],
    ): Promise<void> {
        this.logger.log(
            `Validando disponibilidade dos itens para evento ${eventId}`,
        );

        const eventProducts = await this.prisma.eventProduct.findMany({
            where: {
                id: {
                    in: items.map((item) => item.eventProductId),
                },
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                    },
                },
            },
        });

        const requestedProductIds = new Set(
            items.map((item) => item.eventProductId),
        );
        const availableProductIds = new Set(eventProducts.map((ep) => ep.id));

        const missingProducts = Array.from(requestedProductIds).filter(
            (id) => !availableProductIds.has(id),
        );

        if (missingProducts.length > 0) {
            throw new Error(
                `Produtos não encontrados no evento: ${missingProducts.join(', ')}`,
            );
        }

        const inactiveProducts = eventProducts.filter(
            (ep) => ep.product.status !== 'ACTIVE',
        );

        if (inactiveProducts.length > 0) {
            const inactiveNames = inactiveProducts
                .map((ep) => ep.product.name)
                .join(', ');
            throw new Error(`Produtos inativos: ${inactiveNames}`);
        }

        this.logger.log('Validação de disponibilidade concluída com sucesso');
    }
}
