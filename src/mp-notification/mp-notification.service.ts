import {
  Injectable,
  UnauthorizedException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { OrderStatusDto } from 'src/mp-order/dto/create-mp-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import type { WebhookBody } from './interfaces/webhook.interface';

@Injectable()
export class MpNotificationService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly logger = new Logger(MpNotificationService.name);

  async updateOrderStatus(externalRef: string, status: OrderStatusDto) {
    if (!externalRef || typeof externalRef !== 'string') {
      this.logger.error(`ExternalRef inválido: ${externalRef}`);
      throw new Error('Invalid externalRef parameter');
    }

    if (!status || !Object.values(OrderStatusDto).includes(status)) {
      this.logger.error(`Status inválido: ${status}`);
      throw new Error('Invalid status parameter');
    }

    this.logger.log(
      `Atualizando status do pedido com externalRef: ${externalRef} para status: ${status}`,
    );

    const order = await this.prisma.order.findFirst({
      where: { externalRef },
    });

    if (!order) {
      this.logger.error(
        `Pedido não encontrado com externalRef: ${externalRef}`,
      );
      throw new NotFoundException(
        `Order not found with externalRef: ${externalRef}`,
      );
    }

    this.logger.log(
      `Pedido encontrado: ${order.id}, status atual: ${order.status}`,
    );

    return this.prisma.order.update({
      where: { id: order.id },
      data: { status },
    });
  }

  async processWebhook(params: {
    body: WebhookBody;
    xSignatureHeader: string | undefined;
    xRequestIdHeader: string | undefined;
    dataIdFromQuery: string | undefined;
    secret: string | undefined;
  }) {
    const {
      body,
      xSignatureHeader,
      xRequestIdHeader,
      dataIdFromQuery,
      secret,
    } = params;

    this.logger.log('=== Iniciando processamento do webhook ===');
    this.logger.log(`Action: ${body.action}`);

    this.logger.log(`External Reference: ${body.data.external_reference}`);
    this.logger.log(`Status: ${body.data.status}`);

    this.validateWebhookSignature({
      xSignatureHeader,
      xRequestIdHeader,
      dataIdFromQuery,
      secret,
    });

    const status = this.mapMercadoPagoStatusToOrderStatus(body.data.status);

    if (status) {
      await this.updateOrderStatus(body.data.external_reference, status);
      this.logger.log(`Status atualizado com sucesso para: ${status}`);
    } else {
      this.logger.warn(`Status não mapeado: ${body.data.status}`);
    }

    return {
      success: true,
      message: 'Webhook processed successfully',
      orderStatus: status,
    };
  }

  private mapMercadoPagoStatusToOrderStatus(
    mpStatus: string,
  ): OrderStatusDto | null {
    if (!mpStatus || typeof mpStatus !== 'string') {
      this.logger.warn(`Status inválido recebido: ${mpStatus}`);
      return null;
    }

    const statusMap: Record<string, OrderStatusDto> = {
      created: OrderStatusDto.CREATED,
      expired: OrderStatusDto.EXPIRED,
      canceled: OrderStatusDto.CANCELED,
      at_terminal: OrderStatusDto.AT_TERMINAL,
      processed: OrderStatusDto.PROCESSED,
      refunded: OrderStatusDto.REFUNDED,
      failed: OrderStatusDto.FAILED,
      action_required: OrderStatusDto.ACTION_REQUIRED,
    };

    const normalizedStatus = mpStatus.toLowerCase().trim();
    const mappedStatus = statusMap[normalizedStatus];

    if (!mappedStatus) {
      this.logger.warn(
        `Status não reconhecido: "${mpStatus}" (normalizado: "${normalizedStatus}")`,
      );
    }

    return mappedStatus || null;
  }

  validateWebhookSignature(params: {
    xSignatureHeader: string | undefined;
    xRequestIdHeader: string | undefined;
    dataIdFromQuery: string | undefined;
    secret: string | undefined;
  }): void {
    const { xSignatureHeader, xRequestIdHeader, dataIdFromQuery, secret } =
      params;

    this.logger.log('=== Iniciando validação de assinatura ===');
    this.logger.log(`xSignatureHeader: ${xSignatureHeader}`);
    this.logger.log(`xRequestIdHeader: ${xRequestIdHeader}`);
    this.logger.log(`dataIdFromQuery: ${dataIdFromQuery}`);
    this.logger.log(`secret presente: ${!!secret}`);

    if (!secret) {
      this.logger.error('Secret não encontrado');
      throw new UnauthorizedException('Missing webhook secret');
    }

    if (!xSignatureHeader) {
      this.logger.error('Header x-signature não encontrado');
      throw new UnauthorizedException('Missing x-signature header');
    }

    const parsed = this.parseXSignatureHeader(xSignatureHeader);
    if (!parsed) {
      this.logger.error('Formato inválido do x-signature');
      throw new UnauthorizedException('Invalid x-signature format');
    }
    const { ts, v1 } = parsed;

    this.logger.log(`ts extraído: ${ts}`);
    this.logger.log(`v1 extraído: ${v1}`);

    const templateParts: string[] = [];

    const idValue = this.normalizeDataId(dataIdFromQuery);
    if (idValue) {
      templateParts.push(`id:${idValue}`);
      this.logger.log(`id adicionado ao template: ${idValue}`);
    }

    if (xRequestIdHeader) {
      templateParts.push(`request-id:${xRequestIdHeader}`);
      this.logger.log(`request-id adicionado ao template: ${xRequestIdHeader}`);
    }

    if (ts) {
      templateParts.push(`ts:${ts}`);
      this.logger.log(`ts adicionado ao template: ${ts}`);
    }

    if (templateParts.length === 0) {
      this.logger.error('Nenhum parâmetro válido encontrado para validação');
      throw new UnauthorizedException(
        'No valid parameters found for signature validation',
      );
    }

    const signatureTemplate = templateParts.join(';') + ';';
    this.logger.log(`Template final: "${signatureTemplate}"`);

    const computedHex = createHmac('sha256', secret)
      .update(signatureTemplate)
      .digest('hex');

    this.logger.log(`Assinatura calculada: ${computedHex}`);
    this.logger.log(`Assinatura recebida: ${v1}`);

    const provided = Buffer.from(v1, 'hex');
    const computed = Buffer.from(computedHex, 'hex');

    if (provided.length !== computed.length) {
      this.logger.error(
        `Tamanhos diferentes: provided=${provided.length}, computed=${computed.length}`,
      );
      throw new UnauthorizedException('Invalid signature');
    }

    const valid = timingSafeEqual(provided, computed);
    this.logger.log(`Validação resultou em: ${valid}`);

    if (!valid) {
      this.logger.error('Assinatura inválida');
      throw new UnauthorizedException('Invalid signature');
    }

    this.logger.log('=== Validação de assinatura bem-sucedida ===');
  }

  private parseXSignatureHeader(
    header: string,
  ): { ts: string; v1: string } | null {
    const parts = header.split(',').map((p) => p.trim());
    const map = new Map<string, string>();
    for (const part of parts) {
      const [k, v] = part.split('=');
      if (!k || !v) continue;
      map.set(k.trim(), v.trim());
    }
    const ts = map.get('ts');
    const v1 = map.get('v1');
    if (!ts || !v1) return null;
    return { ts, v1 };
  }

  private normalizeDataId(raw: string | undefined): string | null {
    if (!raw) return null;
    const isAlphaNum = /^[a-z0-9]+$/i.test(raw);
    return isAlphaNum ? raw.toLowerCase() : raw;
  }
}
