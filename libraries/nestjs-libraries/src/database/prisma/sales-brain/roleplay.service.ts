import { Injectable, NotFoundException } from '@nestjs/common';
import { RoleplayRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/roleplay.repository';
import { SalesProductsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/products.repository';
import { OpenaiService } from '@gitroom/nestjs-libraries/openai/openai.service';
import { Prisma, RoleplayPersona } from '@prisma/client';

@Injectable()
export class RoleplayService {
  constructor(
    private _roleplayRepository: RoleplayRepository,
    private _productsRepository: SalesProductsRepository,
    private _openaiService: OpenaiService
  ) {}

  getSessions(organizationId: string) {
    return this._roleplayRepository.getSessions(organizationId);
  }

  getSession(organizationId: string, id: string) {
    return this._roleplayRepository.getSession(organizationId, id);
  }

  private async productContext(organizationId: string) {
    const products = await this._productsRepository.getActiveProducts(organizationId);
    return products.map((p) => ({
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
    }));
  }

  async startSession(
    organizationId: string,
    persona: RoleplayPersona,
    salespersonId?: string
  ) {
    const session = await this._roleplayRepository.createSession(
      organizationId,
      persona,
      salespersonId
    );

    const products = await this.productContext(organizationId);
    const opening = await this._openaiService.generateRoleplayCustomerReply(
      persona,
      products,
      []
    );
    await this._roleplayRepository.addMessage(session.id, 'CUSTOMER', opening);

    return this._roleplayRepository.getSession(organizationId, session.id);
  }

  async reply(organizationId: string, sessionId: string, content: string) {
    const session = await this._roleplayRepository.getSession(organizationId, sessionId);
    if (!session) {
      throw new NotFoundException('Roleplay session not found');
    }
    if (session.status === 'COMPLETED') {
      throw new NotFoundException('This roleplay session is already completed');
    }

    await this._roleplayRepository.addMessage(sessionId, 'TRAINEE', content);

    const products = await this.productContext(organizationId);
    const history = [
      ...session.messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'TRAINEE' as const, content },
    ];

    const customerReply = await this._openaiService.generateRoleplayCustomerReply(
      session.persona,
      products,
      history
    );
    await this._roleplayRepository.addMessage(sessionId, 'CUSTOMER', customerReply);

    return this._roleplayRepository.getSession(organizationId, sessionId);
  }

  async complete(organizationId: string, sessionId: string) {
    const session = await this._roleplayRepository.getSession(organizationId, sessionId);
    if (!session) {
      throw new NotFoundException('Roleplay session not found');
    }
    if (!session.messages.some((m) => m.role === 'TRAINEE')) {
      throw new NotFoundException('Send at least one reply before finishing the roleplay');
    }

    const feedback = await this._openaiService.generateRoleplayFeedback(
      session.persona,
      session.messages.map((m) => ({ role: m.role, content: m.content }))
    );

    return this._roleplayRepository.completeSession(
      organizationId,
      sessionId,
      feedback.score,
      feedback as unknown as Prisma.InputJsonValue
    );
  }
}
