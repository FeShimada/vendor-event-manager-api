import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  eventId: string;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class CreateOrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  eventProductId: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}
