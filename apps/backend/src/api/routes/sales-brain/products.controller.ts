import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { SalesProductsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/products.service';
import { CreateProductDto } from '@gitroom/nestjs-libraries/dtos/sales-brain/product.dto';

@ApiTags('Sales Brain')
@Controller('/sales-brain/products')
export class SalesBrainProductsController {
  constructor(private _productsService: SalesProductsService) {}

  @Get('/')
  getProducts(@GetOrgFromRequest() org: Organization) {
    return this._productsService.getProducts(org.id);
  }

  @Post('/')
  createOrUpdateProduct(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreateProductDto
  ) {
    return this._productsService.createOrUpdateProduct(org.id, body);
  }

  @Delete('/:id')
  deleteProduct(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this._productsService.deleteProduct(org.id, id);
  }
}
