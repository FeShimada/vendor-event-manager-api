import { Body, Controller, Headers, Logger, Post, Query } from '@nestjs/common';
import { MpNotificationService } from './mp-notification.service';
import type { WebhookBody } from './interfaces/webhook.interface';

@Controller('mp-notification')
export class MpNotificationController {
  private readonly logger = new Logger(MpNotificationController.name);

  constructor(private readonly mpNotificationService: MpNotificationService) {}

  @Post('webhook')
  async handleWebhook(
    @Body() body: WebhookBody,
    @Headers('x-signature') xSignature: string | undefined,
    @Headers('x-request-id') xRequestId: string | undefined,
    @Query() query: Record<string, any>,
  ) {
    this.logger.log('=== Webhook recebido ===');
    this.logger.log(`Body: ${JSON.stringify(body)}`);
    this.logger.log(`x-signature: ${xSignature}`);
    this.logger.log(`x-request-id: ${xRequestId}`);
    this.logger.log(`Query params: ${JSON.stringify(query)}`);

    const dataId = query?.['data.id'] as string | undefined;
    this.logger.log(`data.id extraído: ${dataId}`);

    const result = await this.mpNotificationService.processWebhook({
      body,
      xSignatureHeader: xSignature,
      xRequestIdHeader: xRequestId,
      dataIdFromQuery: dataId,
      secret: process.env.MP_WEBHOOK_SECRET,
    });

    return result;
  }
}
