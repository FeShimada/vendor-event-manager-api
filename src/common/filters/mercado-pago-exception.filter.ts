import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Response } from 'express';

export class MercadoPagoException extends Error {
    constructor(
        public readonly statusCode: number,
        public readonly message: string,
        public readonly code?: string,
        public readonly details?: any,
    ) {
        super(message);
        this.name = 'MercadoPagoException';
    }
}

@Catch(MercadoPagoException)
export class MercadoPagoExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(MercadoPagoExceptionFilter.name);

    catch(exception: MercadoPagoException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        this.logger.error(`Mercado Pago Error: ${exception.message}`);
        this.logger.error(`Status Code: ${exception.statusCode}, Error Code: ${exception.code}`);

        let status = HttpStatus.BAD_REQUEST;
        let message = exception.message;
        let errorDetails: any = {
            code: exception.code || 'MERCADO_PAGO_ERROR',
            details: exception.details,
        };

        switch (exception.statusCode) {
            case 409:
                status = HttpStatus.CONFLICT;
                message = 'Já existe uma ordem em fila no terminal';
                errorDetails = {
                    code: 'ALREADY_QUEUED_ORDER',
                    message: 'There is already a queued order on the terminal.',
                    suggestion: 'Aguarde a ordem atual ser processada ou cancele a ordem pendente',
                };
                break;

            case 400:
                status = HttpStatus.BAD_REQUEST;
                message = 'Dados inválidos para o Mercado Pago';
                errorDetails = {
                    code: 'INVALID_REQUEST_DATA',
                    message: exception.message,
                    suggestion: 'Verifique os dados enviados para o Mercado Pago',
                };
                break;

            case 401:
                status = HttpStatus.UNAUTHORIZED;
                message = 'Erro de autenticação com o Mercado Pago';
                errorDetails = {
                    code: 'AUTHENTICATION_ERROR',
                    message: exception.message,
                    suggestion: 'Verifique as credenciais de acesso ao Mercado Pago',
                };
                break;

            case 403:
                status = HttpStatus.FORBIDDEN;
                message = 'Acesso negado ao Mercado Pago';
                errorDetails = {
                    code: 'ACCESS_DENIED',
                    message: exception.message,
                    suggestion: 'Verifique as permissões de acesso ao Mercado Pago',
                };
                break;

            case 404:
                status = HttpStatus.NOT_FOUND;
                message = 'Recurso não encontrado no Mercado Pago';
                errorDetails = {
                    code: 'RESOURCE_NOT_FOUND',
                    message: exception.message,
                    suggestion: 'Verifique se o terminal ou recurso existe no Mercado Pago',
                };
                break;

            case 429:
                status = HttpStatus.TOO_MANY_REQUESTS;
                message = 'Limite de requisições excedido no Mercado Pago';
                errorDetails = {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: exception.message,
                    suggestion: 'Aguarde um momento antes de tentar novamente',
                };
                break;

            case 500:
            case 502:
            case 503:
            case 504:
                status = HttpStatus.SERVICE_UNAVAILABLE;
                message = 'Serviço do Mercado Pago temporariamente indisponível';
                errorDetails = {
                    code: 'SERVICE_UNAVAILABLE',
                    message: exception.message,
                    suggestion: 'Tente novamente em alguns instantes',
                };
                break;

            default:
                status = HttpStatus.INTERNAL_SERVER_ERROR;
                message = 'Erro interno no processamento do pagamento';
                errorDetails = {
                    code: 'INTERNAL_PAYMENT_ERROR',
                    message: exception.message,
                    suggestion: 'Entre em contato com o suporte',
                };
        }

        response.status(status).json({
            statusCode: status,
            message,
            error: errorDetails,
            timestamp: new Date().toISOString(),
            path: ctx.getRequest().url,
        });
    }
} 