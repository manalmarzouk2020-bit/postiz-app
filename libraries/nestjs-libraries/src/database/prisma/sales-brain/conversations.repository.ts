import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Prisma, SalesBuyingStage, SalesChannel, SalesMessageRole } from '@prisma/client';

@Injectable()
export class SalesConversationsRepository {
  constructor(
    private _conversation: PrismaRepository<'salesConversation'>,
    private _message: PrismaRepository<'salesMessage'>,
    private _decision: PrismaRepository<'salesAiDecision'>
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
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  addMessage(
    conversationId: string,
    role: SalesMessageRole,
    content: string,
    metadata?: Prisma.InputJsonValue
  ) {
    return this._message.model.salesMessage.create({
      data: { conversationId, role, content, metadata },
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
