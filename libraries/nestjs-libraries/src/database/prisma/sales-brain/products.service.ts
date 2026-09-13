import { Injectable } from '@nestjs/common';
import { SalesProductsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/products.repository';
import { CreateProductDto } from '@gitroom/nestjs-libraries/dtos/sales-brain/product.dto';

@Injectable()
export class SalesProductsService {
  constructor(private _productsRepository: SalesProductsRepository) {}

  getProducts(organizationId: string) {
    return this._productsRepository.getProducts(organizationId);
  }

  getActiveProducts(organizationId: string) {
    return this._productsRepository.getActiveProducts(organizationId);
  }

  getProduct(organizationId: string, id: string) {
    return this._productsRepository.getProduct(organizationId, id);
  }

  createOrUpdateProduct(organizationId: string, body: CreateProductDto) {
    return this._productsRepository.createOrUpdateProduct(organizationId, body);
  }

  deleteProduct(organizationId: string, id: string) {
    return this._productsRepository.deleteProduct(organizationId, id);
  }
}
