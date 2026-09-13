import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { CreateProductDto } from '@gitroom/nestjs-libraries/dtos/sales-brain/product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalesProductsRepository {
  constructor(private _product: PrismaRepository<'salesProduct'>) {}

  getProducts(organizationId: string) {
    return this._product.model.salesProduct.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  getActiveProducts(organizationId: string) {
    return this._product.model.salesProduct.findMany({
      where: { organizationId, deletedAt: null, isActive: true },
    });
  }

  getProduct(organizationId: string, id: string) {
    return this._product.model.salesProduct.findFirst({
      where: { organizationId, id, deletedAt: null },
    });
  }

  createOrUpdateProduct(organizationId: string, body: CreateProductDto) {
    const data: Prisma.SalesProductUncheckedCreateInput = {
      organizationId,
      name: body.name,
      description: body.description,
      category: body.category,
      price: body.price,
      pricingModel: body.pricingModel,
      features: body.features as Prisma.InputJsonValue,
      benefits: body.benefits as Prisma.InputJsonValue,
      primaryOutcome: body.primaryOutcome,
      secondaryOutcomes: body.secondaryOutcomes as Prisma.InputJsonValue,
      targetMarket: body.targetMarket,
      guarantees: body.guarantees,
      refundPolicy: body.refundPolicy,
      competitors: body.competitors as Prisma.InputJsonValue,
      testimonials: body.testimonials as Prisma.InputJsonValue,
      faqs: body.faqs as unknown as Prisma.InputJsonValue,
      isActive: body.isActive ?? true,
    };

    if (body.id) {
      return this._product.model.salesProduct.update({
        where: { id: body.id, organizationId },
        data,
      });
    }

    return this._product.model.salesProduct.create({
      data,
    });
  }

  deleteProduct(organizationId: string, id: string) {
    return this._product.model.salesProduct.update({
      where: { id, organizationId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
