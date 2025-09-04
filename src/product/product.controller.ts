import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { User } from 'src/common/decorators/user.decorator';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createProductDto: CreateProductDto, @User() user: { userId: string; }) {
    return this.productService.create({ ...createProductDto, userId: user.userId });
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @User() user: { userId: string; }) {
    return this.productService.update(id, { ...updateProductDto, userId: user.userId });
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
