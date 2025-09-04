import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Product } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createProductDto: CreateProductDto & { userId: string; }): Promise<Product> {
    return this.prisma.product.create({
      data: {
        userId: createProductDto.userId,
        name: createProductDto.name,
        price: createProductDto.price,
        cost: createProductDto.cost,
        status: createProductDto.status,
      },
    });
  }

  async findAll(): Promise<Product[]> {
    return this.prisma.product.findMany();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto & { userId: string; }): Promise<Product> {
    const { userId, name, price, cost, status } = updateProductDto;
    return this.prisma.product.update({
      where: { id },
      data: {
        userId,
        name,
        price,
        cost,
        status,
      },
    });
  }

  async remove(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }
    return product;
  }
}
