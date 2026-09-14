import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Prisma, SalesBuyingStage, SalesChannel, SalesMessageRole } from '@prisma/client';

@Injectable()
export class SalesConversationsRepository {
  constructor(
    private _conversation: PrismaRepository<'salesConversation'>,
    private _message: PrismaRepository<'salesMessage'>,
    private _decision: PrismaRepository<'salesAiDecision'>,
    private _analysis: PrismaRepository<'salesConversationAnalysis'>
  ) {}

  async getOrCreateConversation(
    organizationId: string,
    leadId: string,
    channel: SalesChannel
  ) {
    const existing = await this._conversation.model.salesConversation.findFirst({
      where: { organizationId, leadId },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return existing;
    }

    return this._conversation.model.salesConversation.create({
      data: { organizationId, leadId, channel },
    });
  }

  getConversation(organizationId: string, id: string) {
    return this._conversation.model.salesConversation.findFirst({
      where: { organizationId, id },
      include: { messages: { orderBy: { createdAt: 'asc' } }, analysis: true },
    });
  }

  upsertAnalysis(
    organizationId: string,
    conversationId: string,
    data: {
      discovery: number;
      personalization: number;
      relevance: number;
      empathy: number;
      valueCommunication: number;
      objectionHandling: number;
      closing: number;
      followUp: number;
      accuracy: number;
      score: number;
      whyBought?: string | null;
      whyNotBought?: string | null;
    }
  ) {
    return this._analysis.model.salesConversationAnalysis.upsert({
      where: { conversationId },
      create: { organizationId, conversationId, ...data },
      update: data,
    });
  }

  addMessage(
    conversationId: string,
    role: SalesMessageRole,
    content: string,
    metadata?: Prisma.InputJsonValue,
    isDraft = false,
    salespersonId?: string
  ) {
    return this._message.model.salesMessage.create({
      data: { conversationId, role, content, metadata, isDraft, salespersonId },
    });
  }

  updateConversationStage(
    organizationId: string,
    id: string,
    currentStage: SalesBuyingStage
  ) {
    return this._conversation.model.salesConversation.update({
      where: { id, organizationId },
      data: { currentStage, lastMessageAt: new Date() },
    });
  }

  setHandoff(
    organizationId: string,
    id: string,
    needsHumanAttention: boolean,
    escalationReason?: string | null
  ) {
    return this._conversation.model.salesConversation.update({
      where: { id, organizationId },
      data: { needsHumanAttention, escalationReason },
    });
  }

  getHandoffs(organizationId: string) {
    return this._conversation.model.salesConversation.findMany({
      where: { organizationId, needsHumanAttention: true },
      include: {
        lead: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  getDraftMessage(organizationId: string, messageId: string) {
    return this._message.model.salesMessage.findFirst({
      where: {
        id: messageId,
        isDraft: true,
        conversation: { organizationId },
      },
    });
  }

  setMessageDraftState(messageId: string, isDraft: boolean) {
    return this._message.model.salesMessage.update({
      where: { id: messageId },
      data: { isDraft },
    });
  }

  deleteMessage(messageId: string) {
    return this._message.model.salesMessage.delete({ where: { id: messageId } });
  }

  saveDecision(data: {
    organizationId: string;
    leadId: string;
    conversationId: string;
    productId?: string;
    intent: string;
    buyingStage: SalesBuyingStage;
    painPoints: Prisma.InputJsonValue;
    objections: Prisma.InputJsonValue;
    recommendedAction: string;
    responseDraft: string;
    confidence: Prisma.InputJsonValue;
    trace: Prisma.InputJsonValue;
  }) {
    return this._decision.model.salesAiDecision.create({ data });
  }
}
