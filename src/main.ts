import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração melhorada do ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = error.constraints;
          const property = error.property;
          const value = error.value;

          return {
            field: property,
            value: value,
            message: Object.values(constraints || {}).join(', '),
            code: 'VALIDATION_ERROR',
          };
        });

        return new BadRequestException({
          message: 'Erro de validação',
          errors: messages,
          code: 'VALIDATION_ERROR',
        });
      },
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Aplicação rodando na porta ${process.env.PORT ?? 3000}`);
}
bootstrap();
