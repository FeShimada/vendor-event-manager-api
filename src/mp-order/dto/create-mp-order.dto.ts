import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export enum OrderStatusDto {
  CREATED = 'CREATED',
  EXPIRED = 'EXPIRED',
  CANCELED = 'CANCELED',
  AT_TERMINAL = 'AT_TERMINAL',
  PROCESSED = 'PROCESSED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
  ACTION_REQUIRED = 'ACTION_REQUIRED',
}

export enum PaymentMethod {
  CARD = 'CARD',
  PIX = 'PIX',
  CASH = 'CASH',
}

export class CreateMpOrderDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  eventId: string;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMpOrderItemDto)
  items: CreateMpOrderItemDto[];
}

export class CreateMpOrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  eventProductId: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}
