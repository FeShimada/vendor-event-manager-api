import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';
import type { ProductStatus } from 'generated/prisma';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createProductDto: CreateProductDto & { userId: string; }) {
    return this.prisma.product.create({
      data: {
        userId: createProductDto.userId,
        name: createProductDto.name,
        price: createProductDto.price,
        cost: createProductDto.cost,
        status: createProductDto.status as ProductStatus | undefined,
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany();
  }

  async findOne(id: string) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  async update(id: string, updateProductDto: UpdateProductDto & { userId: string; }) {
    const { userId, name, price, cost, status } = updateProductDto;
    return this.prisma.product.update({
      where: { id },
      data: {
        userId,
        name,
        price,
        cost,
        status: status as ProductStatus | undefined,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }
}
