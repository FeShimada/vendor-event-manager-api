import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid';
import { MercadoPagoException } from 'src/common/filters/mercado-pago-exception.filter';

export interface MercadoPagoOrderRequest {
  type: string;
  external_reference: string;
  transactions: {
    payments: Array<{
      amount: string;
    }>;
  };
  config: {
    point: {
      terminal_id: string;
    };
  };
}

export interface MercadoPagoOrderResponse {
  id: string;
  external_reference: string;
  status: string;
}

export interface Order {
  id: string;
  amount: Decimal | number;
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);

  constructor(private readonly prisma: PrismaService) { }

  async createOrder(
    order: Order,
    prismaClient: any = this.prisma,
  ): Promise<MercadoPagoOrderResponse> {
    const mpBaseUrl = process.env.MP_BASE_URL;
    const mpAccessToken = process.env.MP_ACCESS_TOKEN;
    const mpTerminalId = process.env.MP_TERMINAL_ID;
    const idempotencyKey = uuidv4();

    if (!mpBaseUrl || !mpAccessToken || !mpTerminalId) {
      this.logger.error('Configurações do Mercado Pago não encontradas');
      throw new MercadoPagoException(
        500,
        'Configurações do Mercado Pago não encontradas',
        'CONFIGURATION_ERROR',
        { missingConfigs: { mpBaseUrl: !mpBaseUrl, mpAccessToken: !mpAccessToken, mpTerminalId: !mpTerminalId } }
      );
    }

    const requestBody: MercadoPagoOrderRequest = {
      type: 'point',
      external_reference: order.id,
      transactions: {
        payments: [
          {
            amount: String(Number(order.amount)),
          },
        ],
      },
      config: {
        point: {
          terminal_id: mpTerminalId,
        },
      },
    };

    this.logger.log(
      `Tentando criar ordem no Mercado Pago para orderId: ${order.id}`,
    );

    try {
      const response = await fetch(`${mpBaseUrl}/v1/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
          'X-Idempotency-Key': idempotencyKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.text();
        this.logger.error(
          `Erro na API do Mercado Pago: ${response.status} - ${errorData}`,
        );

        let errorCode = 'API_ERROR';
        let errorDetails: any = { rawResponse: errorData };

        try {
          const parsedError = JSON.parse(errorData);
          if (parsedError.errors && parsedError.errors.length > 0) {
            const firstError = parsedError.errors[0];
            errorCode = firstError.code || 'API_ERROR';
            errorDetails = {
              code: firstError.code,
              message: firstError.message,
              rawResponse: errorData
            };
          }
        } catch (parseError) {
        }

        throw new MercadoPagoException(
          response.status,
          `Erro na API do Mercado Pago: ${response.status} - ${errorData}`,
          errorCode,
          errorDetails
        );
      }

      const mpOrderData: MercadoPagoOrderResponse = await response.json();

      this.logger.log(
        `Ordem criada com sucesso no Mercado Pago. OrderId: ${order.id}, MP OrderId: ${mpOrderData.id}`,
      );

      await prismaClient.order.update({
        where: { id: order.id },
        data: {
          mercadoPagoId: mpOrderData.id,
          externalRef: mpOrderData.external_reference,
        },
      });

      return mpOrderData;
    } catch (error) {
      if (error instanceof MercadoPagoException) {
        this.logger.error(
          `Falha ao criar ordem no Mercado Pago para orderId ${order.id}: ${error.message}`,
        );
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(
        `Falha ao criar ordem no Mercado Pago para orderId ${order.id}: ${errorMessage}`,
      );

      throw new MercadoPagoException(
        500,
        `Falha ao criar ordem no Mercado Pago: ${errorMessage}`,
        'INTERNAL_ERROR',
        { originalError: errorMessage }
      );
    }
  }

  validateConfiguration(): void {
    const mpBaseUrl = process.env.MP_BASE_URL;
    const mpAccessToken = process.env.MP_ACCESS_TOKEN;
    const mpTerminalId = process.env.MP_TERMINAL_ID;

    if (!mpBaseUrl || !mpAccessToken || !mpTerminalId) {
      throw new MercadoPagoException(
        500,
        'Configurações do Mercado Pago incompletas',
        'CONFIGURATION_ERROR',
        { missingConfigs: { mpBaseUrl: !mpBaseUrl, mpAccessToken: !mpAccessToken, mpTerminalId: !mpTerminalId } }
      );
    }

    this.logger.log('Configurações do Mercado Pago validadas com sucesso');
  }
}
