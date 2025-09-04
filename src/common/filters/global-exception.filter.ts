import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
    Logger,
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        this.logger.error(`Unhandled Exception: ${exception}`);
        if (exception instanceof Error) {
            this.logger.error(`Exception name: ${exception.name}, message: ${exception.message}`);
        }

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Erro interno do servidor';
        let errorDetails: any = {
            code: 'INTERNAL_SERVER_ERROR',
        };

        if (exception instanceof BadRequestException) {
            status = HttpStatus.BAD_REQUEST;
            const response = exception.getResponse() as any;

            if (response && response.errors) {
                message = response.message || 'Erro de validação';
                errorDetails = {
                    code: response.code || 'VALIDATION_ERROR',
                    errors: response.errors,
                };
            } else {
                message = exception.message;
                errorDetails = {
                    code: 'BAD_REQUEST',
                    message: exception.message,
                };
            }
        } else if (exception instanceof UnauthorizedException) {
            status = HttpStatus.UNAUTHORIZED;
            message = exception.message;
            errorDetails = {
                code: 'UNAUTHORIZED',
                message: exception.message,
            };
        } else if (exception instanceof ForbiddenException) {
            status = HttpStatus.FORBIDDEN;
            message = exception.message;
            errorDetails = {
                code: 'FORBIDDEN',
                message: exception.message,
            };
        } else if (exception instanceof NotFoundException) {
            status = HttpStatus.NOT_FOUND;
            message = exception.message;
            errorDetails = {
                code: 'NOT_FOUND',
                message: exception.message,
            };
        } else if (exception instanceof Error) {
            message = exception.message;

            if (message.includes('already_queued_order_on_terminal')) {
                status = HttpStatus.CONFLICT;
                errorDetails = {
                    code: 'ALREADY_QUEUED_ORDER',
                    message: 'There is already a queued order on the terminal.',
                    suggestion: 'Aguarde a ordem atual ser processada ou cancele a ordem pendente',
                };
            } else if (exception.name === 'ValidationError') {
                status = HttpStatus.BAD_REQUEST;
                errorDetails = {
                    code: 'VALIDATION_ERROR',
                    message: exception.message,
                };
            } else {
                errorDetails = {
                    code: 'UNKNOWN_ERROR',
                    message: exception.message,
                    suggestion: 'Entre em contato com o suporte',
                };
            }
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