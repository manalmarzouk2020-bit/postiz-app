import { Injectable } from '@nestjs/common';
import { SalesPlaybookRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/playbook.repository';
import { SalesProductsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/products.repository';
import { OpenaiService } from '@gitroom/nestjs-libraries/openai/openai.service';

@Injectable()
export class SalesPlaybookService {
  constructor(
    private _playbookRepository: SalesPlaybookRepository,
    private _productsRepository: SalesProductsRepository,
    private _openaiService: OpenaiService
  ) {}

  getPlaybook(organizationId: string) {
    return this._playbookRepository.get(organizationId);
  }

  async generatePlaybook(organizationId: string, organizationName: string) {
    const products = await this._productsRepository.getActiveProducts(organizationId);
    const playbook = await this._openaiService.generateSalesPlaybook(
      organizationName,
      products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        pricingModel: p.pricingModel,
        features: p.features,
        benefits: p.benefits,
        primaryOutcome: p.primaryOutcome,
        guarantees: p.guarantees,
        refundPolicy: p.refundPolicy,
        competitors: p.competitors,
        testimonials: p.testimonials,
        faqs: p.faqs,
      }))
    );
    return this._playbookRepository.upsert(organizationId, playbook);
  }
}
