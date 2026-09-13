import { Injectable, NotFoundException } from '@nestjs/common';
import { SalesLeadsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/leads.repository';
import { SalesProductsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/products.repository';
import { SalesConversationsRepository } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/conversations.repository';
import { OpenaiService } from '@gitroom/nestjs-libraries/openai/openai.service';
import {
  calculateLeadScore,
  pipelineStageForBuyingStage,
} from '@gitroom/nestjs-libraries/sales-brain/lead-scoring';
import { SalesBrainConversationMessage } from '@gitroom/nestjs-libraries/sales-brain/sales-brain.types';

/**
 * Orchestrates the sales-brain decision loop for one inbound message:
 * load context -> ask the decision engine -> persist the response, the
 * updated lead score/stage, and a structured, auditable decision trace.
 */
@Injectable()
export class SalesBrainEngineService {
  constructor(
    private _leadsRepository: SalesLeadsRepository,
    private _productsRepository: SalesProductsRepository,
    private _conversationsRepository: SalesConversationsRepository,
    private _openaiService: OpenaiService
  ) {}

  async processIncomingMessage(
    organizationId: string,
    leadId: string,
    organizationName: string,
    content: string
  ) {
    const lead = await this._leadsRepository.getLead(organizationId, leadId);
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const products = await this._productsRepository.getActiveProducts(organizationId);
    const conversation = await this._conversationsRepository.getOrCreateConversation(
      organizationId,
      leadId,
      lead.source
    );

    const priorMessages: SalesBrainConversationMessage[] = (
      lead.conversations.find((c) => c.id === conversation.id)?.messages || []
    ).map((m) => ({ role: m.role, content: m.content }));

    await this._conversationsRepository.addMessage(conversation.id, 'LEAD', content);

    const decision = await this._openaiService.generateSalesBrainDecision({
      organizationName,
      lead: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        knownPainPoints: lead.painPoints,
        knownGoals: lead.goals,
        buyingStage: lead.buyingStage,
        previousObjections: lead.objections,
      },
      products: products.map((p) => ({
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
      })),
      history: priorMessages,
      incomingMessage: content,
    });

    const leadScore = calculateLeadScore({
      buyingStage: decision.buyingStage,
      painScore: decision.painScore,
      urgency: decision.urgency,
      budgetSignal: decision.budgetSignal,
      authorityLevel: decision.authorityLevel,
      productFitConfidence: decision.confidence.productFit,
      engagementCount: priorMessages.length + 1,
      objectionCount: decision.objections.length,
    });
    const pipelineStage = pipelineStageForBuyingStage(decision.buyingStage);
    const bestFitProduct = [...decision.productFit].sort(
      (a, b) => b.fitScore - a.fitScore
    )[0];

    await this._conversationsRepository.addMessage(
      conversation.id,
      'AI',
      decision.response,
      {
        objections: decision.objections,
        painPoints: decision.painPoints,
        conversationalObjective: decision.conversationalObjective,
        shouldEscalateToHuman: decision.shouldEscalateToHuman,
        escalationReason: decision.escalationReason,
      }
    );

    await this._conversationsRepository.updateConversationStage(
      organizationId,
      conversation.id,
      decision.buyingStage
    );

    await this._leadsRepository.updateAfterDecision(organizationId, leadId, {
      buyingStage: decision.buyingStage,
      pipelineStage,
      leadScore,
      painScore: decision.painScore,
      urgency: decision.urgency,
      budgetSignal: decision.budgetSignal,
      authorityLevel: decision.authorityLevel,
      objections: decision.objections,
      painPoints: decision.painPoints,
      ...(bestFitProduct && bestFitProduct.fitScore >= 50
        ? { productInterestId: bestFitProduct.productId }
        : {}),
    });

    const savedDecision = await this._conversationsRepository.saveDecision({
      organizationId,
      leadId,
      conversationId: conversation.id,
      productId: bestFitProduct?.productId,
      intent: decision.intent,
      buyingStage: decision.buyingStage,
      painPoints: decision.painPoints,
      objections: decision.objections,
      recommendedAction: decision.recommendedAction,
      responseDraft: decision.response,
      confidence: decision.confidence,
      trace: decision,
    });

    return {
      conversationId: conversation.id,
      decision,
      leadScore,
      pipelineStage,
      aiDecisionId: savedDecision.id,
    };
  }
}
