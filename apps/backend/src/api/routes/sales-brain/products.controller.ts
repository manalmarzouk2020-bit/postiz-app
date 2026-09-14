import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { Organization, User } from '@prisma/client';
import { SalesProductsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/products.service';
import { SalesAuditLogService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/audit-log.service';
import { CreateProductDto } from '@gitroom/nestjs-libraries/dtos/sales-brain/product.dto';
import { assertSalesBrainAdmin } from '@gitroom/nestjs-libraries/sales-brain/permissions';

@ApiTags('Sales Brain')
@Controller('/sales-brain/products')
export class SalesBrainProductsController {
  constructor(
    private _productsService: SalesProductsService,
    private _auditLogService: SalesAuditLogService
  ) {}

  @Get('/')
  getProducts(@GetOrgFromRequest() org: Organization) {
    return this._productsService.getProducts(org.id);
  }

  @Post('/')
  async createOrUpdateProduct(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body() body: CreateProductDto
  ) {
    assertSalesBrainAdmin(org);
    const product = await this._productsService.createOrUpdateProduct(org.id, body);
    await this._auditLogService.log(
      org.id,
      user.id,
      body.id ? 'update' : 'create',
      'product',
      product.id
    );
    return product;
  }

  @Delete('/:id')
  async deleteProduct(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Param('id') id: string
  ) {
    assertSalesBrainAdmin(org);
    const result = await this._productsService.deleteProduct(org.id, id);
    await this._auditLogService.log(org.id, user.id, 'delete', 'product', id);
    return result;
  }
}
