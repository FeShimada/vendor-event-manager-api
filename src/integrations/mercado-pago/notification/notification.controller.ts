import { Body, Controller, Headers, Logger, Post, Query } from '@nestjs/common';
import type { WebhookBody } from './interfaces/webhook.interface';
import { NotificationService } from './notification.service';

@Controller('integrations/mercado-pago/notification')
export class NotificationController {
    private readonly logger = new Logger(NotificationController.name);

    constructor(private readonly notificationService: NotificationService) { }

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

        const result = await this.notificationService.processWebhook({
            body,
            xSignatureHeader: xSignature,
            xRequestIdHeader: xRequestId,
            dataIdFromQuery: dataId,
            secret: process.env.MP_WEBHOOK_SECRET,
        });

        return result;
    }
}
