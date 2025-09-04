import { ProductStatus } from '@prisma/client';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  price: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  cost: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
