import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientValidationError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.error(`Prisma Error: ${exception.message}`);

    let status = HttpStatus.BAD_REQUEST;
    let message = 'Erro de validação do banco de dados';
    let details: any = null;

    if (exception instanceof Prisma.PrismaClientValidationError) {
      message = 'Dados inválidos para o banco de dados';
      details = {
        code: 'PRISMA_VALIDATION_ERROR',
        message: exception.message,
        suggestion: 'Verifique os tipos de dados enviados',
      };
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'Registro já existe';
          details = {
            field: exception.meta?.target?.[0] || 'unknown',
            code: 'UNIQUE_CONSTRAINT_VIOLATION',
          };
          break;

        case 'P2003':
          message = 'Referência inválida';
          details = {
            field: exception.meta?.field_name || 'unknown',
            code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
          };
          break;

        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Registro não encontrado';
          details = {
            code: 'RECORD_NOT_FOUND',
          };
          break;

        default:
          details = {
            code: exception.code,
            meta: exception.meta,
          };
      }
    }

    response.status(status).json({
      message,
      error: details,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}
