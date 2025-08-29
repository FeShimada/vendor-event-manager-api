import { PartialType } from '@nestjs/mapped-types';
import { CreateMpOrderDto } from './create-mp-order.dto';

export class UpdateMpOrderDto extends PartialType(CreateMpOrderDto) {}
